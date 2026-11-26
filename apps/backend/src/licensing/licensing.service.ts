import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { LicenseVerifierService } from './license-verifier.service';
import type { LicenseStatus, SignedSiteNovaLicense } from './license.types';

const STATE_DIR = process.env.SITENOVA_LICENSE_STATE_DIR ?? '/data/state';
const INSTALLATION_FILE = process.env.SITENOVA_INSTALLATION_ID_FILE ?? STATE_DIR + '/sitenova-installation-id';
const LICENSE_FILE = process.env.SITENOVA_LICENSE_FILE ?? STATE_DIR + '/sitenova-license.json';

@Injectable()
export class LicensingService {
  constructor(private readonly verifier: LicenseVerifierService) {}

  async getInstallationId(): Promise<string> {
    try {
      const id = (await readFile(INSTALLATION_FILE, 'utf8')).trim();
      if (/^[0-9a-f-]{36}$/i.test(id)) return id;
      throw new Error('Installation ID file is invalid; do not delete it. Contact support.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      await mkdir(dirname(INSTALLATION_FILE), { recursive: true });
      const id = randomUUID();
      try {
        await writeFile(INSTALLATION_FILE, id + '\n', { flag: 'wx', mode: 0o600 });
      } catch (writeError) {
        if ((writeError as NodeJS.ErrnoException).code === 'EEXIST') {
          return (await readFile(INSTALLATION_FILE, 'utf8')).trim();
        }
        throw writeError;
      }
      return id;
    }
  }

  async importLicense(input: unknown): Promise<LicenseStatus> {
    const installationId = await this.getInstallationId();
    const verified = this.verifier.verifyEnvelope(input, installationId);
    const existing = await this.readStoredLicense();
    if (existing && verified.payload.generation <= existing.payload.generation) {
      throw new Error('This licence is not newer than the licence already installed');
    }
    await mkdir(dirname(LICENSE_FILE), { recursive: true });
    const temp = LICENSE_FILE + '.tmp';
    await writeFile(temp, JSON.stringify(verified), { mode: 0o600 });
    await chmod(temp, 0o600);
    await rename(temp, LICENSE_FILE);
    return this.statusFrom(verified, installationId);
  }

  async getStatus(): Promise<LicenseStatus> {
    const installationId = await this.getInstallationId();
    if (!this.verifier.isConfigured()) {
      return { mode: 'UNCONFIGURED', installationId, features: [], message: 'Licence verification is not configured. Existing ERP operation is unchanged.' };
    }
    let stored: SignedSiteNovaLicense | null;
    try { stored = await this.readStoredLicense(); }
    catch {
      return { mode: 'INVALID', installationId, features: [], message: 'The stored licence file is unreadable. Existing ERP data is preserved; contact SiteNova support.' };
    }
    if (!stored) {
      return { mode: 'UNLICENSED', installationId, features: [], message: 'No SiteNova licence has been imported. Existing ERP operation is unchanged.' };
    }
    try {
      const verified = this.verifier.verifyEnvelope(stored, installationId);
      return this.statusFrom(verified, installationId);
    } catch {
      return { mode: 'INVALID', installationId, features: [], message: 'The stored licence could not be verified. Existing ERP operation is unchanged; contact SiteNova support.' };
    }
  }

  private async readStoredLicense(): Promise<SignedSiteNovaLicense | null> {
    try { return JSON.parse(await readFile(LICENSE_FILE, 'utf8')) as SignedSiteNovaLicense; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  private statusFrom(license: SignedSiteNovaLicense, installationId: string): LicenseStatus {
    const p = license.payload;
    const now = Date.now();
    const start = Date.parse(p.validFrom);
    const end = Date.parse(p.validUntil);
    const graceEnd = end + 7 * 24 * 60 * 60 * 1000;
    const mode = now < start ? 'INVALID' : now < end ? 'ACTIVE' : now < graceEnd ? 'GRACE' : 'READ_ONLY';
    return {
      mode, installationId, licenseId: p.licenseId, planCode: p.planCode,
      validFrom: p.validFrom, validUntil: p.validUntil,
      graceEndsAt: new Date(graceEnd).toISOString(), generation: p.generation,
      features: p.features, limits: p.limits,
      message: mode === 'ACTIVE' ? 'Subscription active.' :
        mode === 'GRACE' ? 'Subscription expired. Seven-day grace period is active; renew your licence.' :
        mode === 'READ_ONLY' ? 'Grace period ended. Business write requests are blocked; existing data remains available for viewing and export.' :
        'Licence is not yet valid.',
    };
  }
}

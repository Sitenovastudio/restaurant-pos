import { Injectable } from '@nestjs/common';
import { createPublicKey, verify } from 'node:crypto';
import { canonicalJson } from './license-canonical-json';
import type { SignedSiteNovaLicense, SiteNovaLicensePayload } from './license.types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

@Injectable()
export class LicenseVerifierService {
  private readonly keys: Map<string, string>;

  constructor() {
    // JSON map: {"key-id":"-----BEGIN PUBLIC KEY-----..."}
    // Public keys only. The matching private key must remain in SiteNova's
    // central signing service and must never be shipped to a restaurant.
    let parsed: Record<string, string> = {};
    const raw = process.env.SITENOVA_LICENSE_PUBLIC_KEYS;
    if (raw) {
      try { parsed = JSON.parse(raw) as Record<string, string>; }
      catch { throw new Error('SITENOVA_LICENSE_PUBLIC_KEYS must be a JSON object'); }
    }
    this.keys = new Map(Object.entries(parsed));
  }

  isConfigured(): boolean {
    return this.keys.size > 0;
  }

  verifyEnvelope(input: unknown, expectedInstallationId: string): SignedSiteNovaLicense {
    if (!input || typeof input !== 'object') throw new Error('Licence file must be a JSON object');
    const envelope = input as Partial<SignedSiteNovaLicense>;
    const p = envelope.payload as SiteNovaLicensePayload | undefined;
    if (!p || typeof p !== 'object' || typeof envelope.signature !== 'string') {
      throw new Error('Licence file is missing its payload or signature');
    }
    if (!this.isConfigured()) throw new Error('Licence verification is not configured on this server');
    if (p.schemaVersion !== 1 || p.product !== 'sitenova-restaurant-erp') throw new Error('Unsupported licence format or product');
    if (typeof p.licenseId !== 'string' || !p.licenseId || typeof p.customerId !== 'string' || !p.customerId) throw new Error('Licence identity is incomplete');
    if (p.installationId !== expectedInstallationId) throw new Error('This licence belongs to a different installation');
    if (typeof p.keyId !== 'string' || !this.keys.has(p.keyId)) throw new Error('Unknown licence signing key');
    if (!Number.isSafeInteger(p.generation) || p.generation < 1) throw new Error('Invalid licence generation');
    if (p.graceDays !== 7) throw new Error('Unsupported grace policy');
    if (!Number.isSafeInteger(p.limits?.branches) || p.limits.branches < 1 || !Number.isSafeInteger(p.limits?.devices) || p.limits.devices < 1) throw new Error('Invalid licence limits');
    if (!Array.isArray(p.features) || !p.features.every((f) => typeof f === 'string')) throw new Error('Invalid licence features');
    for (const date of [p.issuedAt, p.validFrom, p.validUntil]) {
      if (typeof date !== 'string' || !ISO_DATE.test(date) || Number.isNaN(Date.parse(date))) throw new Error('Invalid licence date');
    }
    if (Date.parse(p.validUntil) <= Date.parse(p.validFrom)) throw new Error('Licence end must be after its start');
    const publicKey = createPublicKey(this.keys.get(p.keyId)!);
    const signature = Buffer.from(envelope.signature, 'base64');
    if (!signature.length || !verify(null, Buffer.from(canonicalJson(p)), publicKey, signature)) {
      throw new Error('Licence signature is invalid');
    }
    return { payload: p, signature: envelope.signature };
  }
}

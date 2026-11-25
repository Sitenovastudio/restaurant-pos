import { generateKeyPairSync, sign } from 'node:crypto';
import { canonicalJson } from './license-canonical-json';
import { LicenseVerifierService } from './license-verifier.service';
import type { SiteNovaLicensePayload } from './license.types';

describe('LicenseVerifierService', () => {
  const installationId = '4f9f4e0b-9e3d-4a1e-8f9d-7b7f0d8c9a10';
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

  const payload: SiteNovaLicensePayload = {
    schemaVersion: 1,
    product: 'sitenova-restaurant-erp',
    licenseId: 'lic_test_001',
    customerId: 'cus_test_001',
    installationId,
    planCode: 'YEARLY',
    issuedAt: '2026-11-25T00:00:00.000Z',
    validFrom: '2026-11-25T00:00:00.000Z',
    validUntil: '2027-11-25T00:00:00.000Z',
    graceDays: 7,
    generation: 1,
    limits: { branches: 1, devices: 10 },
    features: ['pos', 'billing'],
    keyId: 'test-key',
  };

  function service() {
    process.env.SITENOVA_LICENSE_PUBLIC_KEYS = JSON.stringify({ 'test-key': publicPem });
    return new LicenseVerifierService();
  }

  function envelope(data: SiteNovaLicensePayload = payload) {
    return {
      payload: data,
      signature: sign(null, Buffer.from(canonicalJson(data)), privateKey).toString('base64'),
    };
  }

  afterEach(() => {
    delete process.env.SITENOVA_LICENSE_PUBLIC_KEYS;
  });

  it('accepts a valid signature for the matching installation', () => {
    expect(service().verifyEnvelope(envelope(), installationId).payload.licenseId)
      .toBe('lic_test_001');
  });

  it('rejects a different installation', () => {
    expect(() => service().verifyEnvelope(envelope(), 'another-installation'))
      .toThrow('different installation');
  });

  it('rejects a modified payload', () => {
    const signed = envelope();
    signed.payload = { ...signed.payload, planCode: 'LIFETIME' };
    expect(() => service().verifyEnvelope(signed, installationId))
      .toThrow('signature is invalid');
  });

  it('rejects a missing public key configuration', () => {
    delete process.env.SITENOVA_LICENSE_PUBLIC_KEYS;
    expect(() => new LicenseVerifierService().verifyEnvelope(envelope(), installationId))
      .toThrow('not configured');
  });
});

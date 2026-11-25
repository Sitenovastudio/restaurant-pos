export interface SiteNovaLicensePayload {
  schemaVersion: 1;
  product: 'sitenova-restaurant-erp';
  licenseId: string;
  customerId: string;
  installationId: string;
  planCode: string;
  issuedAt: string;
  validFrom: string;
  validUntil: string;
  graceDays: 7;
  generation: number;
  limits: { branches: number; devices: number };
  features: string[];
  keyId: string;
}

export interface SignedSiteNovaLicense {
  payload: SiteNovaLicensePayload;
  signature: string;
}

export type LicenseMode = 'UNCONFIGURED' | 'UNLICENSED' | 'ACTIVE' | 'GRACE' | 'READ_ONLY' | 'INVALID';

export interface LicenseStatus {
  mode: LicenseMode;
  installationId: string;
  licenseId?: string;
  planCode?: string;
  validFrom?: string;
  validUntil?: string;
  graceEndsAt?: string;
  generation?: number;
  features: string[];
  limits?: { branches: number; devices: number };
  message: string;
}

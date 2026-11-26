import { isReadOnlyAllowedRequest } from './license-enforcement.guard';

describe('read-only request policy', () => {
  it('allows safe read methods', () => {
    expect(isReadOnlyAllowedRequest('GET', '/api/v1/orders')).toBe(true);
    expect(isReadOnlyAllowedRequest('HEAD', '/api/v1/orders')).toBe(true);
    expect(isReadOnlyAllowedRequest('OPTIONS', '/api/v1/orders')).toBe(true);
  });

  it('blocks business mutations', () => {
    expect(isReadOnlyAllowedRequest('POST', '/api/v1/orders')).toBe(false);
    expect(isReadOnlyAllowedRequest('PATCH', '/api/v1/menu/items/1')).toBe(false);
    expect(isReadOnlyAllowedRequest('DELETE', '/api/v1/inventory/1')).toBe(false);
    expect(isReadOnlyAllowedRequest('POST', '/api/v1/imports/menu/commit')).toBe(false);
  });

  it('allows local renewal and account recovery routes', () => {
    expect(isReadOnlyAllowedRequest('POST', '/api/v1/license/import')).toBe(true);
    expect(isReadOnlyAllowedRequest('POST', '/api/v1/auth/login')).toBe(true);
    expect(isReadOnlyAllowedRequest('POST', '/api/v1/auth/logout')).toBe(true);
    expect(isReadOnlyAllowedRequest('POST', '/api/v1/auth/2fa/disable')).toBe(true);
  });

  it('allows verified backup restore as a recovery operation', () => {
    expect(isReadOnlyAllowedRequest('POST', '/api/v1/backups/backup-123/restore')).toBe(true);
  });

  it('does not accidentally exempt similarly named routes', () => {
    expect(isReadOnlyAllowedRequest('POST', '/api/v1/license/import/other')).toBe(false);
    expect(isReadOnlyAllowedRequest('POST', '/api/v1/auth/register')).toBe(false);
    expect(isReadOnlyAllowedRequest('POST', '/api/v1/backups/backup-123/restore-extra')).toBe(false);
  });
});

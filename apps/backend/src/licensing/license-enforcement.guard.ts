import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { LicensingService } from './licensing.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * HTTP mutation gate for the expired-subscription read-only state.
 *
 * It is deliberately inert for unconfigured/unlicensed installations while
 * the rollout is in progress. Renewal import, authentication, account
 * security and verified backup restore remain available in read-only mode.
 */
export function isReadOnlyAllowedRequest(method: string, rawPath: string): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;
  const path = rawPath.split('?')[0].replace(/^\/api(?=\/)/, '');
  if (path === '/v1/license/import') return true;
  if (/^\/v1\/auth\/(login|logout|pin-login)$/.test(path)) return true;
  if (/^\/v1\/auth\/2fa\//.test(path)) return true;
  if (/^\/v1\/backups\/[^/]+\/restore$/.test(path)) return true;
  return false;
}

@Injectable()
export class LicenseEnforcementGuard implements CanActivate {
  constructor(private readonly licensing: LicensingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const request = context.switchToHttp().getRequest<Request>();
    if (isReadOnlyAllowedRequest(request.method, request.originalUrl ?? request.url)) {
      return true;
    }

    const status = await this.licensing.getStatus();
    if (status.mode !== 'READ_ONLY') return true;

    throw new HttpException(
      {
        statusCode: HttpStatus.LOCKED,
        error: 'SubscriptionReadOnly',
        code: 'SUBSCRIPTION_READ_ONLY',
        message:
          'The subscription grace period has ended. This installation is read-only. Import a renewed SiteNova licence to resume business operations. Existing data is preserved.',
        license: status,
      },
      HttpStatus.LOCKED,
    );
  }
}

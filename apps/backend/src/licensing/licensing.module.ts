import { Module } from '@nestjs/common';
import { LicenseVerifierService } from './license-verifier.service';
import { LicensingService } from './licensing.service';

@Module({
  providers: [LicenseVerifierService, LicensingService],
  exports: [LicenseVerifierService, LicensingService],
})
export class LicensingModule {}

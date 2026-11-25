import { Module } from '@nestjs/common';
import { LicensingController } from './licensing.controller';
import { LicenseVerifierService } from './license-verifier.service';
import { LicensingService } from './licensing.service';

@Module({
  controllers: [LicensingController],
  providers: [LicenseVerifierService, LicensingService],
  exports: [LicenseVerifierService, LicensingService],
})
export class LicensingModule {}

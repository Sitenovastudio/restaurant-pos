import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LicensingService } from './licensing.service';

/**
 * Local licence administration endpoints. These routes never call the
 * licensing cloud, so status and manual renewal import work on an isolated LAN.
 */
@Controller('v1/license')
@UseGuards(JwtAuthGuard)
export class LicensingController {
  constructor(private readonly licensing: LicensingService) {}

  @Get('status')
  getStatus() {
    return this.licensing.getStatus();
  }

  @Post('import')
  async importLicense(@Body() body: unknown) {
    try {
      return await this.licensing.importLicense(body);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unable to import licence',
      );
    }
  }
}

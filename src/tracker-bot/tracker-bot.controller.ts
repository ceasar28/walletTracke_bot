import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { TrackerBotService } from './tracker-bot.service';
import { SoltrackerService } from 'src/soltracker/soltracker.service';

@Controller('tracker-bot')
export class TrackerBotController {
  constructor(
    private botService: TrackerBotService,
    private trackService: SoltrackerService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  queryBlockchain() {
    return this.botService.saveAlertedTokens();
  }

  @HttpCode(HttpStatus.OK)
  @Get('tokens')
  allToken() {
    return this.botService.sendTokens();
  }

  @Get('track')
  trackWallet() {
    return this.trackService.trackTokens(
      '8MqRTAQnjhDYH7TWS1b1DjFog4CLZfySWE5cZeotG2VW',
    );
  }

  @Get('metadata')
  metadata() {
    return this.trackService.getWalletTransaction(
      '2VEDMcRPWbS8acxoFZ3SFmV2Ehd8zdVfcAcaqonqfqgCdEr5LJ4Gta6LPMJeGA1ZM52EwZCMvtZ6uxkgPwfShBM4',
    );
  }
}

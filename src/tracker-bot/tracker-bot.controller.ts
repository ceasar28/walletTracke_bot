import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { TrackerBotService } from './tracker-bot.service';

@Controller('tracker-bot')
export class TrackerBotController {
  constructor(private botService: TrackerBotService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  signUp() {
    return this.botService.queryBlockchain();
  }

  @HttpCode(HttpStatus.OK)
  @Get('tokens')
  allToken() {
    return this.botService.sendTokens();
  }
}

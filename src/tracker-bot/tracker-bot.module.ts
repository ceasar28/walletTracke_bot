import { Module } from '@nestjs/common';
import { TrackerBotService } from './tracker-bot.service';
import { TrackerBotController } from './tracker-bot.controller';

@Module({
  providers: [TrackerBotService],
  controllers: [TrackerBotController],
})
export class TrackerBotModule {}

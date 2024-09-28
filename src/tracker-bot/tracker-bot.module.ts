import { Module } from '@nestjs/common';
import { TrackerBotService } from './tracker-bot.service';
import { TrackerBotController } from './tracker-bot.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [TrackerBotService],
  controllers: [TrackerBotController],
})
export class TrackerBotModule {}

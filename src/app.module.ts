import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrackerBotModule } from './tracker-bot/tracker-bot.module';

@Module({
  imports: [TrackerBotModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { TrackerBotModule } from './tracker-bot/tracker-bot.module';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SoltrackerModule } from './soltracker/soltracker.module';
import { SolscanScrapperModule } from './solscan-scrapper/solscan-scrapper.module';

@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot(),
    SoltrackerModule,
    SolscanScrapperModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

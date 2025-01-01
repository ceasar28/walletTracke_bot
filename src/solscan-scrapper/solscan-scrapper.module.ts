import { Module } from '@nestjs/common';
import { SolscanScrapperService } from './solscan-scrapper.service';
import { SolscanScrapperController } from './solscan-scrapper.controller';

@Module({
  providers: [SolscanScrapperService],
  exports: [SolscanScrapperService],
  controllers: [SolscanScrapperController],
})
export class SolscanScrapperModule {}

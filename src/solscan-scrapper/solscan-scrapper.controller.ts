import { Controller, Get } from '@nestjs/common';
import { SolscanScrapperService } from './solscan-scrapper.service';

@Controller('solscan-scrapper')
export class SolscanScrapperController {
  constructor(private solscanScrapperService: SolscanScrapperService) {}

  @Get('scrape')
  trackWallet() {
    return this.solscanScrapperService.getTokenDetails(
      'CHgJUemeVxEWbQjahGoSvwg294dWieVhwx2QJBoJpump',
    );
  }
}

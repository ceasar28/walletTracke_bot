import { Test, TestingModule } from '@nestjs/testing';
import { SolscanScrapperService } from './solscan-scrapper.service';

describe('SolscanScrapperService', () => {
  let service: SolscanScrapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SolscanScrapperService],
    }).compile();

    service = module.get<SolscanScrapperService>(SolscanScrapperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

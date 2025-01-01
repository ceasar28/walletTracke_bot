import { Test, TestingModule } from '@nestjs/testing';
import { SolscanScrapperController } from './solscan-scrapper.controller';

describe('SolscanScrapperController', () => {
  let controller: SolscanScrapperController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SolscanScrapperController],
    }).compile();

    controller = module.get<SolscanScrapperController>(SolscanScrapperController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

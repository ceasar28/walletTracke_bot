import { Test, TestingModule } from '@nestjs/testing';
import { TrackerBotService } from './tracker-bot.service';

describe('TrackerBotService', () => {
  let service: TrackerBotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrackerBotService],
    }).compile();

    service = module.get<TrackerBotService>(TrackerBotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { TrackerBotController } from './tracker-bot.controller';

describe('TrackerBotController', () => {
  let controller: TrackerBotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrackerBotController],
    }).compile();

    controller = module.get<TrackerBotController>(TrackerBotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

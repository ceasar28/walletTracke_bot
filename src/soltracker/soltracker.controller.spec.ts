import { Test, TestingModule } from '@nestjs/testing';
import { SoltrackerController } from './soltracker.controller';

describe('SoltrackerController', () => {
  let controller: SoltrackerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SoltrackerController],
    }).compile();

    controller = module.get<SoltrackerController>(SoltrackerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

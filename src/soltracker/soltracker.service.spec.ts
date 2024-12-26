import { Test, TestingModule } from '@nestjs/testing';
import { SoltrackerService } from './soltracker.service';

describe('SoltrackerService', () => {
  let service: SoltrackerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SoltrackerService],
    }).compile();

    service = module.get<SoltrackerService>(SoltrackerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

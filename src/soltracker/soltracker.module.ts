import { Module } from '@nestjs/common';
import { SoltrackerService } from './soltracker.service';

@Module({
  providers: [SoltrackerService]
})
export class SoltrackerModule {}

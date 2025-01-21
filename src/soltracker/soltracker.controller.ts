import { Controller, Get } from '@nestjs/common';
import { SoltrackerService } from './soltracker.service';

@Controller('soltracker')
export class SoltrackerController {
  constructor(private readonly soltrackerService: SoltrackerService) {}

  @Get('tokens')
  getTokens() {
    return this.soltrackerService.getAllTokens();
  }
}

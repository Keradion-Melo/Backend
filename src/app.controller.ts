import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
export class AppController {
  @SkipThrottle()
  @Get()
  checkHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

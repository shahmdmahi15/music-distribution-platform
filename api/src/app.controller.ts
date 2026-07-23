import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('operational')
  operational() {
    return this.appService.operational();
  }

  @Get()
  getHello() {
    return this.appService.getHome();
  }
}

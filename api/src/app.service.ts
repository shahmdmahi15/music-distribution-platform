import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  operational() {
    return { operational: true };
  }

  health() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  getHome() {
    return 'This is music distribution platform api design by Shah Md Mahi from RoyalMotionIT!';
  }
}

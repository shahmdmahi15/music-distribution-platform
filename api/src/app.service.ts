import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  operational() {
    return { operational: true };
  }

  getHome() {
    return 'This is music distribution platform api design by Shah Md Mahi from RoyalMotionIT!';
  }
}

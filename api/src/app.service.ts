import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHome(): string {
    return 'This is music distribution platform api design by Shah Md Mahi from RoyalMotionIT!';
  }
}

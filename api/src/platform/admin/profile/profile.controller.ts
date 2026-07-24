import { Body, Controller, Patch } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';
import { UploadProfileImageDto } from './dto/upload-profile-image.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Patch('upload')
  async uploadProfileImage(
    @CurrentUser('id') id: string,
    @Body() dto: UploadProfileImageDto,
  ) {
    return await this.profileService.uploadProfileImage(id, dto.image);
  }
}

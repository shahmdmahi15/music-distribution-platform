import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class UploadProfileImageDto {
  @IsNotEmpty({ message: 'Image is required.' })
  @IsString({ message: 'Image must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @Matches(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, {
    message: 'Invalid image data',
  })
  @Matches(/^.{1,7000000}$/, { message: 'Image too large' })
  image!: string;
}

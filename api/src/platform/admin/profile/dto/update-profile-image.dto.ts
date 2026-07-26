import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class UpdateProfileImageDto {
  @IsNotEmpty({ message: 'Image is required.' })
  @IsString({ message: 'Image must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @Matches(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, {
    message: 'Invalid image data',
  })
  @MaxLength(1500000, { message: 'Image must be under 1MB' })
  image!: string;
}

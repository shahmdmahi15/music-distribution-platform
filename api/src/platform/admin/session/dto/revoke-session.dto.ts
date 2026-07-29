import { IsNotEmpty, IsString } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class RevokeSessionDto {
  @IsNotEmpty({ message: 'Session id is required.' })
  @IsString({ message: 'Session id must be a string.' })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  sessionId!: string;
}

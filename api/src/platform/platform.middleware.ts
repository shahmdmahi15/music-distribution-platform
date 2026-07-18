import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/config/env.config';
import * as crypto from 'crypto';

@Injectable()
export class PlatformMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const incomingKey = req.headers['x-api-key'];

    // 1. Fail early if the header is missing or is an array
    if (!incomingKey || typeof incomingKey !== 'string') {
      throw new UnauthorizedException('Missing or invalid API Key format');
    }

    // 2. Fetch the target hash from your environment variables
    const targetHash = this.configService.get('PLATFORM_API_KEY', {
      infer: true,
    });

    // 3. Hash the incoming plaintext key using SHA-256
    const incomingHash = crypto
      .createHash('sha256')
      .update(incomingKey)
      .digest('hex');

    // 4. Use timingSafeEqual to prevent timing attacks
    const bufferIncoming = Buffer.from(incomingHash, 'hex');
    const bufferTarget = Buffer.from(targetHash, 'hex');

    // Buffers must be the exact same length for timingSafeEqual to work
    if (
      bufferIncoming.length !== bufferTarget.length ||
      !crypto.timingSafeEqual(bufferIncoming, bufferTarget)
    ) {
      throw new UnauthorizedException('Invalid API Key');
    }

    next();
  }
}

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

    // 2. Fetch target key/hash from environment
    const targetKeyOrHash = this.configService.get('PLATFORM_API_KEY', {
      infer: true,
    });

    const incomingTrimmed = incomingKey.trim();
    const targetTrimmed = (targetKeyOrHash || '').trim();

    // 3. Direct constant-time match (if identical raw key configured in both services)
    const directBufIncoming = Buffer.from(incomingTrimmed);
    const directBufTarget = Buffer.from(targetTrimmed);
    const isDirectMatch =
      directBufIncoming.length === directBufTarget.length &&
      crypto.timingSafeEqual(directBufIncoming, directBufTarget);

    // 4. SHA-256 hash match (if target is a 64-char hex digest)
    let isHashMatch = false;
    if (targetTrimmed.length === 64) {
      const incomingHash = crypto
        .createHash('sha256')
        .update(incomingTrimmed)
        .digest('hex');
      const hashBufIncoming = Buffer.from(incomingHash, 'hex');
      const hashBufTarget = Buffer.from(targetTrimmed, 'hex');
      if (
        hashBufIncoming.length === hashBufTarget.length &&
        crypto.timingSafeEqual(hashBufIncoming, hashBufTarget)
      ) {
        isHashMatch = true;
      }
    }

    if (!isDirectMatch && !isHashMatch) {
      console.warn(
        `[PlatformMiddleware] API Key mismatch! Received (len ${incomingTrimmed.length}): "${incomingTrimmed.slice(0, 10)}...", Expected (len ${targetTrimmed.length}): "${targetTrimmed.slice(0, 10)}..."`,
      );
      throw new UnauthorizedException('Invalid API Key');
    }

    next();
  }
}

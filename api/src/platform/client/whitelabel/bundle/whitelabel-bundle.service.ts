import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from 'src/lib/redis/redis.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const TOKEN_PREFIX = 'whitelabel:bundle:token:';
const TOKEN_TTL_SECONDS = 1200; // 20 minutes

@Injectable()
export class WhitelabelBundleService {
  private readonly logger = new Logger(WhitelabelBundleService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Generates a single-use, 20-minute ephemeral token to download whitelabel.zip.
   */
  async createBundleDownloadToken(whiteLabelId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const key = `${TOKEN_PREFIX}${token}`;
    await this.redis.set(
      key,
      JSON.stringify({ whiteLabelId, createdAt: Date.now() }),
      TOKEN_TTL_SECONDS,
    );
    this.logger.log(
      `Created bundle provisioning token for WhiteLabel ${whiteLabelId} (TTL: ${TOKEN_TTL_SECONDS}s)`,
    );
    return token;
  }

  /**
   * Validates and immediately consumes (deletes) the single-use token.
   */
  async validateAndConsumeToken(
    token: string,
  ): Promise<{ whiteLabelId: string }> {
    if (!token || typeof token !== 'string' || token.length < 32) {
      throw new UnauthorizedException(
        'Invalid or malformed bundle download token.',
      );
    }

    const key = `${TOKEN_PREFIX}${token}`;
    const data = await this.redis.get(key);

    if (!data) {
      throw new UnauthorizedException(
        'Bundle download token has expired or is invalid.',
      );
    }

    // Immediately consume the token to enforce single-use
    await this.redis.del(key);

    try {
      const parsed = JSON.parse(data);
      return { whiteLabelId: parsed.whiteLabelId };
    } catch {
      throw new UnauthorizedException('Corrupted token payload.');
    }
  }

  /**
   * Resolves the path to whitelabel.zip. If missing, attempts automated packaging.
   */
  getBundleFilePath(): string {
    const bundlePaths = [
      path.resolve(process.cwd(), 'bundles/whitelabel.zip'),
      path.resolve(process.cwd(), 'api/bundles/whitelabel.zip'),
      path.resolve(process.cwd(), '../api/bundles/whitelabel.zip'),
      path.resolve(__dirname, '../../../../../../bundles/whitelabel.zip'),
    ];

    for (const p of bundlePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    // If missing, attempt to run the packager script
    this.logger.warn(
      'whitelabel.zip not found in bundles directory. Attempting build...',
    );
    const scriptPath = path.resolve(
      process.cwd(),
      'scripts/build-whitelabel-bundle.sh',
    );
    const altScriptPath = path.resolve(
      process.cwd(),
      '../scripts/build-whitelabel-bundle.sh',
    );
    const targetScript = fs.existsSync(scriptPath) ? scriptPath : altScriptPath;

    if (fs.existsSync(targetScript)) {
      try {
        execSync(`bash "${targetScript}"`, { stdio: 'inherit' });
        for (const p of bundlePaths) {
          if (fs.existsSync(p)) {
            return p;
          }
        }
      } catch (err) {
        this.logger.error('Failed to run bundle packaging script:', err);
      }
    }

    throw new NotFoundException(
      'WhiteLabel distribution bundle (whitelabel.zip) is not available.',
    );
  }

  /**
   * Retrieves SHA-256 checksum of the bundle if available.
   */
  getBundleChecksum(): string | null {
    try {
      const bundlePath = this.getBundleFilePath();
      const checksumPath = `${bundlePath}.sha256`;
      if (fs.existsSync(checksumPath)) {
        return fs.readFileSync(checksumPath, 'utf8').trim();
      }
      const buffer = fs.readFileSync(bundlePath);
      return crypto.createHash('sha256').update(buffer).digest('hex');
    } catch {
      return null;
    }
  }
}

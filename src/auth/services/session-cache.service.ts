import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';

export interface SessionCacheEntry {
  userId: string;
  deviceInfo?: string;
  ipAddress?: string;
}

const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class SessionCacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async cacheSession(
    tokenHash: string,
    entry: SessionCacheEntry,
  ): Promise<void> {
    const key = `session:${tokenHash}`;
    await this.cacheManager.set(key, entry, this.getRefreshTtlMs());
  }

  async getSession(tokenHash: string): Promise<SessionCacheEntry | undefined> {
    return this.cacheManager.get<SessionCacheEntry>(`session:${tokenHash}`);
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.cacheManager.del(`session:${tokenHash}`);
  }

  async checkLoginRateLimit(
    ipAddress?: string,
    email?: string,
  ): Promise<void> {
    const keys = this.getLoginRateLimitKeys(ipAddress, email);
    for (const key of keys) {
      const attempts = await this.cacheManager.get<number>(key);
      if (attempts !== undefined && attempts >= LOGIN_RATE_LIMIT) {
        throw new HttpException(
          'Too many login attempts. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  async incrementLoginRateLimit(
    ipAddress?: string,
    email?: string,
  ): Promise<void> {
    const keys = this.getLoginRateLimitKeys(ipAddress, email);
    for (const key of keys) {
      const attempts = (await this.cacheManager.get<number>(key)) ?? 0;
      await this.cacheManager.set(key, attempts + 1, LOGIN_RATE_WINDOW_MS);
    }
  }

  async resetLoginRateLimit(
    ipAddress?: string,
    email?: string,
  ): Promise<void> {
    const keys = this.getLoginRateLimitKeys(ipAddress, email);
    for (const key of keys) {
      await this.cacheManager.del(key);
    }
  }

  private getLoginRateLimitKeys(
    ipAddress?: string,
    email?: string,
  ): string[] {
    const keys: string[] = [];
    if (ipAddress) {
      keys.push(`ratelimit:login:ip:${ipAddress}`);
    }
    if (email) {
      keys.push(`ratelimit:login:email:${email.toLowerCase()}`);
    }
    return keys;
  }

  private getRefreshTtlMs(): number {
    const expiresInStr = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const days = parseInt(expiresInStr.replace('d', ''), 10) || 7;
    return days * 24 * 60 * 60 * 1000;
  }
}

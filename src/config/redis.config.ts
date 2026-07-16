import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

export const redisConfig: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    // Railway exposes Redis as REDIS_URL, REDIS_PRIVATE_URL, or REDIS_PUBLIC_URL
    const redisUrl =
      configService.get<string>('REDIS_URL') ||
      configService.get<string>('REDIS_PRIVATE_URL') ||
      configService.get<string>('REDIS_PUBLIC_URL');

    // Parse the URL manually so ioredis receives host/port/password explicitly.
    // cache-manager-ioredis-yet passes options directly to ioredis, which
    // supports a `url` field but some versions ignore it — explicit host/port
    // is more reliable across versions.
    let redisOptions: Record<string, unknown>;

    if (redisUrl) {
      const parsed = new URL(redisUrl);
      redisOptions = {
        host: parsed.hostname,
        port: Number(parsed.port) || 6379,
        password: parsed.password || undefined,
        username:
          parsed.username && parsed.username !== 'default'
            ? parsed.username
            : undefined,
        // Railway internal connections use plain TCP (no TLS)
        tls: parsed.protocol === 'rediss:' ? {} : undefined,
      };
    } else {
      // Local fallback
      redisOptions = {
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get<string>('REDIS_PASSWORD') || undefined,
      };
    }

    const store = await redisStore(redisOptions);
    return {
      store: store as unknown as string,
    };
  },
};

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
    const store = await redisStore({
      url: redisUrl,
    });
    return {
      store: store as unknown as string,
    };
  },
};

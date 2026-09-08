import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    autoLoadEntities: true,
    migrations: ['dist/database/migrations/*.js'],
    migrationsRun: configService.get<string>('DB_MIGRATIONS_RUN') === 'true',
    synchronize: configService.get<string>('DB_SYNCHRONIZE') !== 'false',
    ssl:
      configService.get<string>('NODE_ENV') === 'production'
        ? { rejectUnauthorized: false }
        : false,
  }),
};

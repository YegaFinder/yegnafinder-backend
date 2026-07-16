import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadsService } from './services/uploads.service';
import { UploadsController } from './controllers/uploads.controller';
import awsConfig from '../config/aws.config';

@Module({
  imports: [ConfigModule.forFeature(awsConfig)],
  providers: [UploadsService],
  controllers: [UploadsController],
  exports: [UploadsService],
})
export class UploadsModule {}

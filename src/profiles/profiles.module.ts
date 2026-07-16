import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerProfile } from './entities/customer-profile.entity';
import { MerchantProfile } from './entities/merchant-profile.entity';
import { BusinessHours } from './entities/business-hours.entity';
import { ProfilesService } from './services/profiles.service';
import { BusinessHoursService } from './services/business-hours.service';
import { CustomerProfilesController } from './controllers/customer-profiles.controller';
import { MerchantProfilesController } from './controllers/merchant-profiles.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerProfile, MerchantProfile, BusinessHours]),
    UsersModule,
  ],
  providers: [ProfilesService, BusinessHoursService],
  controllers: [CustomerProfilesController, MerchantProfilesController],
  exports: [ProfilesService, BusinessHoursService, TypeOrmModule],
})
export class ProfilesModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { Business } from './entities/business.entity';
import { BusinessHours } from './entities/business-hours.entity';
import { Favorite } from './entities/favorite.entity';
import { SavedPlace } from './entities/saved-place.entity';
import { BusinessCategory } from './entities/business-category.entity';
import { BusinessGallery } from './entities/business-gallery.entity';
import { BusinessDocument } from './entities/business-document.entity';
import { RecentSearch } from './entities/recent-search.entity';
import { RecentView } from './entities/recent-view.entity';
import { Notification } from './entities/notification.entity';
import { UserSetting } from './entities/user-setting.entity';
import { Language } from './entities/language.entity';
import { Address } from './entities/address.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { MerchantSubscription } from './entities/merchant-subscription.entity';
import { BusinessReview } from './entities/business-review.entity';
import { BusinessFollower } from './entities/business-follower.entity';
import { Promotion } from './entities/promotion.entity';
import { BusinessStaff } from './entities/business-staff.entity';

import { ProfilesService } from './services/profiles.service';
import { BusinessHoursService } from './services/business-hours.service';
import { FavoritesService } from './services/favorites.service';
import { SavedPlacesService } from './services/saved-places.service';
import { PromotionsService } from './services/promotions.service';
import { BusinessStaffService } from './services/business-staff.service';

import { FavoritesController } from './controllers/favorites.controller';
import { SavedPlacesController } from './controllers/saved-places.controller';
import { ProfileController } from './controllers/profile.controller';
import { MerchantController } from './controllers/merchant.controller';
import { PromotionsController } from './controllers/promotions.controller';
import { BusinessStaffController } from './controllers/business-staff.controller';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile, 
      Business, 
      BusinessHours,
      Favorite,
      SavedPlace,
      BusinessCategory,
      BusinessGallery,
      BusinessDocument,
      RecentSearch,
      RecentView,
      Notification,
      UserSetting,
      Language,
      Address,
      SubscriptionPlan,
      MerchantSubscription,
      BusinessReview,
      BusinessFollower,
      Promotion,
      BusinessStaff,
    ]),
    UsersModule,
  ],
  providers: [ProfilesService, BusinessHoursService, FavoritesService, SavedPlacesService, PromotionsService, BusinessStaffService],
  controllers: [ProfileController, MerchantController, FavoritesController, SavedPlacesController, PromotionsController, BusinessStaffController],
  exports: [ProfilesService, BusinessHoursService, FavoritesService, SavedPlacesService, PromotionsService, BusinessStaffService, TypeOrmModule],
})
export class ProfilesModule {}

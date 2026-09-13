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
import { Message } from './entities/message.entity';
import { UserSetting } from './entities/user-setting.entity';
import { Language } from './entities/language.entity';
import { Address } from './entities/address.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { MerchantSubscription } from './entities/merchant-subscription.entity';
import { BusinessReview } from './entities/business-review.entity';
import { BusinessFollower } from './entities/business-follower.entity';
import { Promotion } from './entities/promotion.entity';
import { BusinessStaff } from './entities/business-staff.entity';
import { Payment } from './payments/payment.entity';
import { Booking } from './entities/booking.entity';

import { ProfilesService } from './services/profiles.service';
import { BusinessHoursService } from './services/business-hours.service';
import { FavoritesService } from './services/favorites.service';
import { SavedPlacesService } from './services/saved-places.service';
import { PromotionsService } from './services/promotions.service';
import { BusinessStaffService } from './services/business-staff.service';
import { BusinessGalleryService } from './services/business-gallery.service';
import { ListingApprovalService } from './services/listing-approval.service';
import { MessagesService } from './services/messages.service';
import { NotificationService } from './services/notification.service';
import { PaymentService } from './services/payment.service';
import { MockPaymentGateway } from './payments/payment-gateway.provider';
import { ReviewsService } from './services/reviews.service';
import { BookingsService } from './services/bookings.service';
import { CategoriesService } from './services/categories.service';
import { DiscoveryService } from './services/discovery.service';
import { AdminAnalyticsService } from './services/admin-analytics.service';

import { FavoritesController } from './controllers/favorites.controller';
import { SavedPlacesController } from './controllers/saved-places.controller';
import { ProfileController } from './controllers/profile.controller';
import { MerchantController } from './controllers/merchant.controller';
import { PromotionsController } from './controllers/promotions.controller';
import { BusinessStaffController } from './controllers/business-staff.controller';
import { AdminListingsController } from './controllers/admin-listings.controller';
import { PublicListingsController } from './controllers/public-listings.controller';
import { BusinessDiscoveryController } from './controllers/business-discovery.controller';
import { BusinessMessagingController } from './controllers/business-messaging.controller';
import { PaymentController } from './controllers/payment.controller';
import { ReviewsController } from './controllers/reviews.controller';
import { BookingsController } from './controllers/bookings.controller';
import { CategoriesController } from './controllers/categories.controller';
import { DiscoveryController } from './controllers/discovery.controller';
import { AdminAnalyticsController } from './controllers/admin-analytics.controller';
import { AdminReviewsController } from './controllers/admin-reviews.controller';

import { UsersModule } from '../users/users.module';
import { UploadsModule } from '../uploads/uploads.module';
import { MailService } from '../common/services/mail.service';

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
      Message,
      UserSetting,
      Language,
      Address,
      SubscriptionPlan,
      MerchantSubscription,
      BusinessReview,
      BusinessFollower,
      Promotion,
      BusinessStaff,
      Payment,
      Booking,
    ]),
    UsersModule,
    UploadsModule,
  ],
  providers: [
    ProfilesService,
    BusinessHoursService,
    FavoritesService,
    SavedPlacesService,
    PromotionsService,
    BusinessStaffService,
    BusinessGalleryService,
    ListingApprovalService,
    MessagesService,
    NotificationService,
    MailService,
    PaymentService,
    MockPaymentGateway,
    ReviewsService,
    BookingsService,
    CategoriesService,
    DiscoveryService,
    AdminAnalyticsService,
  ],
  controllers: [
    ProfileController,
    MerchantController,
    FavoritesController,
    SavedPlacesController,
    PromotionsController,
    BusinessStaffController,
    AdminListingsController,
    PublicListingsController,
    BusinessDiscoveryController,
    BusinessMessagingController,
    PaymentController,
    ReviewsController,
    BookingsController,
    CategoriesController,
    DiscoveryController,
    AdminAnalyticsController,
    AdminReviewsController,
  ],
  exports: [
    ProfilesService,
    BusinessHoursService,
    FavoritesService,
    SavedPlacesService,
    PromotionsService,
    BusinessStaffService,
    BusinessGalleryService,
    ListingApprovalService,
    MessagesService,
    NotificationService,
    ReviewsService,
    BookingsService,
    CategoriesService,
    DiscoveryService,
    AdminAnalyticsService,
    TypeOrmModule,
  ],
})
export class ProfilesModule {}

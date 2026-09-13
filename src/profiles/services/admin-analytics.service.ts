import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { Business } from '../entities/business.entity';
import { Booking } from '../entities/booking.entity';
import { BusinessReview } from '../entities/business-review.entity';
import { ListingStatus } from '../enums/listing-status.enum';

@Injectable()
export class AdminAnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BusinessReview)
    private readonly reviewRepository: Repository<BusinessReview>,
  ) {}

  async getSummary() {
    const totalUsers = await this.userRepository.count();
    const totalMerchants = await this.userRepository.count({ where: { role: UserRole.MERCHANT } });
    const totalListings = await this.businessRepository.count();
    const totalApprovedListings = await this.businessRepository.count({ where: { listingStatus: ListingStatus.APPROVED } });
    const totalBookings = await this.bookingRepository.count();
    const totalReviews = await this.reviewRepository.count();

    return {
      totalUsers,
      totalMerchants,
      totalListings,
      totalApprovedListings,
      totalBookings,
      totalReviews,
    };
  }
}

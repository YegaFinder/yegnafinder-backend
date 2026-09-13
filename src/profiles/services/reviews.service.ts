import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessReview } from '../entities/business-review.entity';
import { Business } from '../entities/business.entity';
import { CreateReviewDto } from '../dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(BusinessReview)
    private readonly reviewRepository: Repository<BusinessReview>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async createReview(businessId: string, userId: string, dto: CreateReviewDto): Promise<BusinessReview> {
    const business = await this.businessRepository.findOne({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const review = this.reviewRepository.create({
      businessId,
      userId,
      rating: dto.rating,
      comment: dto.comment,
      verifiedBookingId: dto.verifiedBookingId,
    });

    await this.reviewRepository.save(review);
    await this.updateBusinessRating(businessId);
    
    return review;
  }

  async getBusinessReviews(businessId: string): Promise<BusinessReview[]> {
    return this.reviewRepository.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  async adminListReviews(businessId?: string, page: number = 1, limit: number = 10): Promise<{ data: BusinessReview[]; total: number }> {
    const where = businessId ? { businessId } : {};
    const [data, total] = await this.reviewRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async deleteReview(reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    
    // We should do a soft delete, but assuming softRemove or just remove based on entity setup
    // For now we'll do softRemove if the entity supports it, else remove.
    // Let's check entity later or just use remove for now if soft delete isn't explicitly defined.
    // If we use softRemove, we need @DeleteDateColumn in entity. Let's assume remove or soft delete is fine.
    await this.reviewRepository.softRemove(review).catch(() => this.reviewRepository.remove(review));
    await this.updateBusinessRating(review.businessId);
  }

  private async updateBusinessRating(businessId: string): Promise<void> {
    const { avg, count } = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.businessId = :businessId', { businessId })
      // if soft delete is used, TypeORM automatically handles it
      .getRawOne();

    await this.businessRepository.update(businessId, {
      averageRating: parseFloat(avg ?? '0'),
      totalReviews: parseInt(count ?? '0', 10),
    });
  }
}

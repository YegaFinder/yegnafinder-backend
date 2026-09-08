import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { ListingStatus } from '../enums/listing-status.enum';

@Injectable()
export class ListingApprovalService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async listForOps(status?: ListingStatus): Promise<Business[]> {
    return this.businessRepository.find({
      where: status ? { listingStatus: status } : {},
      relations: { user: true, businessHours: true },
      order: { createdAt: 'ASC' },
    });
  }

  async listPublic(): Promise<Business[]> {
    return this.businessRepository.find({
      where: { isPublic: true, listingStatus: ListingStatus.APPROVED },
      relations: { user: true, businessHours: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getById(id: string): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { id },
      relations: { user: true, businessHours: true },
    });
    if (!business) {
      throw new NotFoundException('Business listing not found');
    }
    return business;
  }

  async getPublicById(id: string): Promise<Business> {
    const business = await this.getById(id);
    if (!business.isPublic || business.listingStatus !== ListingStatus.APPROVED) {
      throw new NotFoundException('Business listing not found');
    }
    return business;
  }

  async submitForApproval(userId: string): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { userId },
      relations: { user: true, businessHours: true },
    });
    if (!business) {
      throw new NotFoundException('Merchant profile not found');
    }

    if (business.listingStatus === ListingStatus.APPROVED && business.isPublic) {
      return business;
    }

    if (!business.isProfileComplete) {
      throw new BadRequestException(
        'Complete the business profile before submitting for approval',
      );
    }

    business.listingStatus = ListingStatus.PENDING;
    business.isPublic = false;
    business.listingSubmittedAt = new Date();
    business.listingRejectionReason = null;
    return this.businessRepository.save(business);
  }

  async approve(id: string, adminUserId: string): Promise<Business> {
    const business = await this.getById(id);
    business.listingStatus = ListingStatus.APPROVED;
    business.isPublic = true;
    business.listingReviewedAt = new Date();
    business.listingReviewedById = adminUserId;
    business.listingRejectionReason = null;
    return this.businessRepository.save(business);
  }

  async reject(
    id: string,
    adminUserId: string,
    reason: string,
  ): Promise<Business> {
    const business = await this.getById(id);
    business.listingStatus = ListingStatus.REJECTED;
    business.isPublic = false;
    business.listingReviewedAt = new Date();
    business.listingReviewedById = adminUserId;
    business.listingRejectionReason = reason;
    return this.businessRepository.save(business);
  }
}

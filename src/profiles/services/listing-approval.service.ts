import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { ListingStatus } from '../enums/listing-status.enum';

type PaginatedListingResult = {
  listings: Business[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

type NearbyListingResult = {
  listings: (Business & { distanceKm: number })[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

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

  async listPublic(page: number = 1, limit: number = 10): Promise<{ data: Business[]; total: number }> {
    const [data, total] = await this.businessRepository.findAndCount({
      where: { isPublic: true, listingStatus: ListingStatus.APPROVED },
      relations: { user: true, businessHours: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async searchPublicPaginated(
    query: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedListingResult> {
    const normalizedPage = Number.isFinite(Number(page))
      ? Math.max(1, Number(page))
      : 1;
    const normalizedLimit = Number.isFinite(Number(limit))
      ? Math.min(Math.max(1, Number(limit)), 100)
      : 10;

    const keyword = (query || '').trim();
    const normalizedKeyword = keyword
      .replace(/[^a-z0-9\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const baseQuery = this.businessRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.user', 'user')
      .leftJoinAndSelect('business.businessHours', 'businessHours')
      .where('business.is_public = :isPublic', { isPublic: true })
      .andWhere('business.listing_status = :listingStatus', {
        listingStatus: ListingStatus.APPROVED,
      });

    if (normalizedKeyword) {
      baseQuery.andWhere(
        `to_tsvector('english', coalesce(business.business_name, '') || ' ' || coalesce(business.description, '') || ' ' || coalesce(business.business_address, '') || ' ' || coalesce(business.services_offered::text, '')) @@ plainto_tsquery(:keyword)`,
        { keyword: normalizedKeyword },
      );
    }

    const total = await baseQuery.getCount();
    const listings = await baseQuery
      .orderBy('business.created_at', 'DESC')
      .skip((normalizedPage - 1) * normalizedLimit)
      .take(normalizedLimit)
      .getMany();

    return {
      listings,
      meta: {
        total,
        page: normalizedPage,
        limit: normalizedLimit,
      },
    };
  }

  async searchPublic(query: string): Promise<Business[]> {
    const keyword = (query || '').trim();
    if (!keyword) {
      return this.listPublic();
    }

    const normalizedKeyword = keyword
      .replace(/[^a-z0-9\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalizedKeyword) {
      return this.listPublic();
    }

    return this.businessRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.user', 'user')
      .leftJoinAndSelect('business.businessHours', 'businessHours')
      .where('business.is_public = :isPublic', { isPublic: true })
      .andWhere('business.listing_status = :listingStatus', {
        listingStatus: ListingStatus.APPROVED,
      })
      .andWhere(
        `to_tsvector('english', coalesce(business.business_name, '') || ' ' || coalesce(business.description, '') || ' ' || coalesce(business.business_address, '')) @@ plainto_tsquery(:keyword)`,
        { keyword: normalizedKeyword },
      )
      .orderBy('business.created_at', 'DESC')
      .getMany();
  }

  async findNearbyPaginated(
    latitude: number,
    longitude: number,
    radiusKm: number,
    page = 1,
    limit = 10,
  ): Promise<NearbyListingResult> {
    const normalizedPage = Number.isFinite(Number(page))
      ? Math.max(1, Number(page))
      : 1;
    const normalizedLimit = Number.isFinite(Number(limit))
      ? Math.min(Math.max(1, Number(limit)), 100)
      : 10;

    const lat = Number(latitude);
    const lon = Number(longitude);
    const radius = Number(radiusKm);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException(
        'latitude and longitude must be valid numbers',
      );
    }

    if (!Number.isFinite(radius) || radius <= 0) {
      throw new BadRequestException('radiusKm must be a positive number');
    }

    const businesses = await this.listPublic();

    const hitBusinesses = businesses
      .filter((business) => {
        if (business.latitude == null || business.longitude == null) {
          return false;
        }

        const businessLat = Number(business.latitude);
        const businessLon = Number(business.longitude);
        const distanceKm = this.calculateDistanceKm(
          lat,
          lon,
          businessLat,
          businessLon,
        );
        return distanceKm <= radius;
      })
      .map((business) => {
        const businessLat = Number(business.latitude);
        const businessLon = Number(business.longitude);
        const distanceKm = this.calculateDistanceKm(
          lat,
          lon,
          businessLat,
          businessLon,
        );
        return Object.assign(business, { distanceKm });
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const total = hitBusinesses.length;
    const start = (normalizedPage - 1) * normalizedLimit;
    const end = start + normalizedLimit;

    return {
      listings: hitBusinesses.slice(start, end),
      meta: {
        total,
        page: normalizedPage,
        limit: normalizedLimit,
      },
    };
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<Business[]> {
    const lat = Number(latitude);
    const lon = Number(longitude);
    const radius = Number(radiusKm);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException(
        'latitude and longitude must be valid numbers',
      );
    }

    if (!Number.isFinite(radius) || radius <= 0) {
      throw new BadRequestException('radiusKm must be a positive number');
    }

    const businesses = await this.listPublic();

    return businesses
      .filter((business) => {
        if (business.latitude == null || business.longitude == null) {
          return false;
        }

        const businessLat = Number(business.latitude);
        const businessLon = Number(business.longitude);
        const distanceKm = this.calculateDistanceKm(
          lat,
          lon,
          businessLat,
          businessLon,
        );
        return distanceKm <= radius;
      })
      .map((business) => {
        const businessLat = Number(business.latitude);
        const businessLon = Number(business.longitude);
        const distanceKm = this.calculateDistanceKm(
          lat,
          lon,
          businessLat,
          businessLon,
        );
        return Object.assign(business, { __distanceKm: distanceKm });
      })
      .sort((a, b) => a.__distanceKm - b.__distanceKm)
      .map((business) => {
        delete business.__distanceKm;
        return business;
      });
  }

  private calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const earthRadiusKm = 6371;
    const deltaLat = this.toRadians(lat2 - lat1);
    const deltaLon = this.toRadians(lon2 - lon1);

    const startLat = this.toRadians(lat1);
    const endLat = this.toRadians(lat2);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(startLat) *
        Math.cos(endLat) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
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

  async verifyBusiness(id: string, adminUserId: string): Promise<Business> {
    const business = await this.getById(id);
    business.verificationStatus = 'verified';
    business.listingReviewedAt = new Date();
    business.listingReviewedById = adminUserId;
    return this.businessRepository.save(business);
  }

  async unverifyBusiness(id: string, adminUserId: string): Promise<Business> {
    const business = await this.getById(id);
    business.verificationStatus = 'pending';
    business.listingReviewedAt = new Date();
    business.listingReviewedById = adminUserId;
    return this.businessRepository.save(business);
  }
}

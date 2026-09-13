import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { DiscoveryQueryDto } from '../dto/discovery-query.dto';
import { ListingStatus } from '../enums/listing-status.enum';

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async findAll(query: DiscoveryQueryDto): Promise<any> {
    const { categoryId, q, lat, lng, radius = 10, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.businessRepository.createQueryBuilder('business')
      .leftJoinAndSelect('business.businessCategories', 'categories')
      .leftJoinAndSelect('business.businessHours', 'hours')
      .leftJoinAndSelect('business.galleries', 'galleries')
      .where('business.listingStatus = :status', { status: ListingStatus.APPROVED })
      .andWhere('business.isPublic = :isPublic', { isPublic: true });

    if (categoryId) {
      queryBuilder.andWhere('categories.id = :categoryId', { categoryId });
    }

    if (q) {
      queryBuilder.andWhere('(business.businessName ILIKE :q OR business.description ILIKE :q)', { q: `%${q}%` });
    }

    if (lat && lng) {
      const haversine = `( 6371 * acos( cos( radians(:lat) ) * cos( radians( business.latitude ) ) * cos( radians( business.longitude ) - radians(:lng) ) + sin( radians(:lat) ) * sin( radians( business.latitude ) ) ) )`;
      queryBuilder.addSelect(`${haversine}`, 'distance');
      queryBuilder.andWhere(`${haversine} <= :radius`);
      queryBuilder.setParameters({ ...queryBuilder.getParameters(), lat, lng, radius });
      queryBuilder.orderBy('distance', 'ASC');
    } else {
      queryBuilder.orderBy('business.createdAt', 'DESC');
    }

    queryBuilder.skip(skip).take(limit);

    const [businesses, total] = await queryBuilder.getManyAndCount();

    return {
      items: businesses,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { id },
      relations: ['businessCategories', 'businessHours', 'galleries', 'promotions', 'staffMembers'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }
}

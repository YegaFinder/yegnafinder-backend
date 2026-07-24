import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from '../entities/promotion.entity';
import { Business } from '../entities/business.entity';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionsRepository: Repository<Promotion>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async getPromotions(businessId: string): Promise<Promotion[]> {
    return this.promotionsRepository.find({ where: { businessId } });
  }

  async addPromotion(businessId: string, data: Partial<Promotion>): Promise<Promotion> {
    const promotion = this.promotionsRepository.create({ businessId, ...data });
    return this.promotionsRepository.save(promotion);
  }

  async removePromotion(businessId: string, promotionId: string): Promise<void> {
    await this.promotionsRepository.delete({ id: promotionId, businessId });
  }
}

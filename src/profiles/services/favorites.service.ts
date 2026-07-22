import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../entities/favorite.entity';
import { Business } from '../entities/business.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
  ) {}

  async getFavorites(userId: string): Promise<Favorite[]> {
    return this.favoritesRepository.find({
      where: { userId },
      relations: { business: true },
    });
  }

  async addFavorite(userId: string, businessId: string): Promise<Favorite> {
    const business = await this.businessRepository.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    let favorite = await this.favoritesRepository.findOne({
      where: { userId, businessId },
    });

    if (!favorite) {
      favorite = this.favoritesRepository.create({ userId, businessId });
      await this.favoritesRepository.save(favorite);
    }
    return favorite;
  }

  async removeFavorite(userId: string, businessId: string): Promise<void> {
    await this.favoritesRepository.delete({ userId, businessId });
  }
}

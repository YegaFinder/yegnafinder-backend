import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedPlace } from '../entities/saved-place.entity';

@Injectable()
export class SavedPlacesService {
  constructor(
    @InjectRepository(SavedPlace)
    private savedPlacesRepository: Repository<SavedPlace>,
  ) {}

  async getSavedPlaces(userId: string): Promise<SavedPlace[]> {
    return this.savedPlacesRepository.find({
      where: { userId },
    });
  }

  async addSavedPlace(userId: string, label: string, address: string, lat?: number, lng?: number): Promise<SavedPlace> {
    const place = this.savedPlacesRepository.create({
      userId,
      label,
      address,
      latitude: lat,
      longitude: lng,
    });
    return this.savedPlacesRepository.save(place);
  }

  async removeSavedPlace(userId: string, placeId: string): Promise<void> {
    await this.savedPlacesRepository.delete({ userId, id: placeId });
  }
}

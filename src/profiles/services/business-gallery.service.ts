import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessGallery } from '../entities/business-gallery.entity';
import { Business } from '../entities/business.entity';
import { UploadsService, UploadType } from '../../uploads/services/uploads.service';
import type { UploadedFileInput } from '../../uploads/services/uploads.service';

const MAX_GALLERY_PHOTOS = 20;

@Injectable()
export class BusinessGalleryService {
  constructor(
    @InjectRepository(BusinessGallery)
    private readonly galleryRepository: Repository<BusinessGallery>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly uploadsService: UploadsService,
  ) {}

  async getGallery(businessId: string): Promise<BusinessGallery[]> {
    return this.galleryRepository.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  async uploadPhotos(
    businessId: string,
    ownerUserId: string,
    files: UploadedFileInput[] | undefined,
  ): Promise<BusinessGallery[]> {
    if (!files?.length) {
      throw new BadRequestException('At least one image file is required');
    }

    const existingCount = await this.galleryRepository.count({
      where: { businessId },
    });
    if (existingCount + files.length > MAX_GALLERY_PHOTOS) {
      throw new BadRequestException(
        `Gallery is limited to ${MAX_GALLERY_PHOTOS} photos`,
      );
    }

    const saved: BusinessGallery[] = [];
    const uploadedKeys: string[] = [];
    try {
      for (const file of files) {
        const uploaded = await this.uploadsService.uploadFile(
          file,
          UploadType.GALLERY,
          ownerUserId,
        );
        uploadedKeys.push(uploaded.key);
        const row = this.galleryRepository.create({
          businessId,
          mediaUrl: uploaded.fileUrl,
          storageKey: uploaded.key,
          mediaType: 'image',
        });
        saved.push(await this.galleryRepository.save(row));
      }
    } catch (error) {
      await Promise.all(uploadedKeys.map((key) => this.uploadsService.deleteFile(key)));
      if (saved.length) {
        await this.galleryRepository.remove(saved);
      }
      throw error;
    }
    return saved;
  }

  async deletePhoto(
    businessId: string,
    photoId: string,
  ): Promise<void> {
    const photo = await this.galleryRepository.findOne({
      where: { id: photoId, businessId },
    });
    if (!photo) {
      throw new NotFoundException('Gallery photo not found');
    }

    await this.uploadsService.deleteFile(photo.storageKey || photo.mediaUrl);
    await this.galleryRepository.remove(photo);
  }

  async assertBusinessExists(businessId: string): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException('Merchant profile not found');
    }
    return business;
  }
}

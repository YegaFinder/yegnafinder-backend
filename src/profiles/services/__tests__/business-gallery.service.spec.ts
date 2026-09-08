import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessGalleryService } from '../business-gallery.service';
import { BusinessGallery } from '../../entities/business-gallery.entity';
import { Business } from '../../entities/business.entity';
import { UploadType } from '../../../uploads/services/uploads.service';
import { UploadsService } from '../../../uploads/services/uploads.service';

describe('BusinessGalleryService', () => {
  let service: BusinessGalleryService;
  const galleryRepository = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const businessRepository = { findOne: jest.fn() };
  const uploadsService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessGalleryService,
        { provide: getRepositoryToken(BusinessGallery), useValue: galleryRepository },
        { provide: getRepositoryToken(Business), useValue: businessRepository },
        { provide: UploadsService, useValue: uploadsService },
      ],
    }).compile();

    service = module.get(BusinessGalleryService);
    galleryRepository.count.mockResolvedValue(0);
    galleryRepository.create.mockImplementation((row) => row);
    galleryRepository.save.mockImplementation(async (row) => ({ id: 'photo-1', ...row }));
  });

  afterEach(() => jest.clearAllMocks());

  it('persists the returned S3 URL and key for gallery images', async () => {
    uploadsService.uploadFile.mockResolvedValue({
      fileUrl: 'https://cdn.example.com/uploads/gallery/user-1/image.png',
      key: 'uploads/gallery/user-1/image.png',
    });

    const result = await service.uploadPhotos(
      'business-1',
      'user-1',
      [{ originalname: 'image.png', mimetype: 'image/png', buffer: Buffer.from('x') }],
    );

    expect(uploadsService.uploadFile).toHaveBeenCalledWith(
      expect.anything(),
      UploadType.GALLERY,
      'user-1',
    );
    expect(galleryRepository.save).toHaveBeenCalledWith({
      businessId: 'business-1',
      mediaUrl: 'https://cdn.example.com/uploads/gallery/user-1/image.png',
      storageKey: 'uploads/gallery/user-1/image.png',
      mediaType: 'image',
    });
    expect(result).toHaveLength(1);
  });

  it('removes uploaded objects and saved rows when a later file fails', async () => {
    uploadsService.uploadFile
      .mockResolvedValueOnce({
        fileUrl: 'https://cdn.example.com/uploads/gallery/user-1/one.png',
        key: 'uploads/gallery/user-1/one.png',
      })
      .mockRejectedValueOnce(new Error('S3 unavailable'));

    await expect(
      service.uploadPhotos('business-1', 'user-1', [
        { originalname: 'one.png', mimetype: 'image/png', buffer: Buffer.from('1') },
        { originalname: 'two.png', mimetype: 'image/png', buffer: Buffer.from('2') },
      ]),
    ).rejects.toThrow('S3 unavailable');

    expect(uploadsService.deleteFile).toHaveBeenCalledWith(
      'uploads/gallery/user-1/one.png',
    );
    expect(galleryRepository.remove).toHaveBeenCalled();
  });
});

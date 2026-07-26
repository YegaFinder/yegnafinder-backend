import {
  INestApplication,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MerchantController } from '../src/profiles/controllers/merchant.controller';
import { ProfilesService } from '../src/profiles/services/profiles.service';
import { BusinessHoursService } from '../src/profiles/services/business-hours.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

describe('MerchantController Profile & Gallery (e2e)', () => {
  let app: INestApplication<App>;

  const mockUser = { id: 'merchant-123' };
  const mockProfile = {
    id: 'profile-123',
    userId: mockUser.id,
    user: { 
      id: mockUser.id, 
      firstName: 'John', 
      lastName: 'Doe', 
      email: 'john@example.com', 
      role: 'MERCHANT', 
      isEmailVerified: true, 
      isActive: true, 
      createdAt: new Date().toISOString()
    },
    businessName: 'Test Business',
    description: 'Test Description',
    socialMedia: {},
    businessCategories: [],
    servicesOffered: [],
    businessHours: [],
    verificationStatus: 'PENDING',
    averageRating: 0,
    totalReviews: 0,
    isProfileComplete: true,
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockProfilesService = {
    createMerchantProfile: jest.fn(),
    getMerchantProfile: jest.fn(),
    updateMerchantProfile: jest.fn(),
  };
  
  const mockBusinessHoursService = {
    updateBusinessHours: jest.fn(),
    getBusinessHours: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MerchantController],
      providers: [
        { provide: ProfilesService, useValue: mockProfilesService },
        { provide: BusinessHoursService, useValue: mockBusinessHoursService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('POST /api/v1/merchant/profile', () => {
    it('should create a merchant profile', async () => {
      const createDto = { businessName: 'Test Business' };
      mockProfilesService.createMerchantProfile.mockResolvedValue(mockProfile);

      const response = await request(app.getHttpServer())
        .post('/api/v1/merchant/profile')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(expect.objectContaining({
        id: mockProfile.id,
        businessName: mockProfile.businessName
      }));
      expect(mockProfilesService.createMerchantProfile).toHaveBeenCalledWith(
        mockUser.id,
        createDto,
      );
    });
  });

  describe('GET /api/v1/merchant/profile', () => {
    it('should get a merchant profile', async () => {
      mockProfilesService.getMerchantProfile.mockResolvedValue(mockProfile);

      const response = await request(app.getHttpServer())
        .get('/api/v1/merchant/profile')
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        id: mockProfile.id,
        businessName: mockProfile.businessName
      }));
      expect(mockProfilesService.getMerchantProfile).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('PUT /api/v1/merchant/profile', () => {
    it('should update a merchant profile', async () => {
      const updateDto = { description: 'Updated Description' };
      mockProfilesService.updateMerchantProfile.mockResolvedValue({
        ...mockProfile,
        ...updateDto,
      });

      const response = await request(app.getHttpServer())
        .put('/api/v1/merchant/profile')
        .send(updateDto)
        .expect(200);

      expect(response.body.description).toEqual('Updated Description');
      expect(mockProfilesService.updateMerchantProfile).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
    });
  });

  describe('POST /api/v1/merchant/logo', () => {
    it('should upload a logo', async () => {
      mockProfilesService.updateMerchantProfile.mockResolvedValue({
        ...mockProfile,
        logoUrl: 'https://s3.amazonaws.com/bucket/logos/test-logo.jpg',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/merchant/logo')
        .attach('file', Buffer.from('logo'), 'test-logo.jpg')
        .expect(201);

      expect(response.body.logoUrl).toBeDefined();
      expect(mockProfilesService.updateMerchantProfile).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(Object),
      );
    });
  });

  describe('POST /api/v1/merchant/banner', () => {
    it('should upload a banner', async () => {
      mockProfilesService.updateMerchantProfile.mockResolvedValue({
        ...mockProfile,
        bannerUrl: 'https://s3.amazonaws.com/bucket/banners/test-banner.jpg',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/merchant/banner')
        .attach('file', Buffer.from('banner'), 'test-banner.jpg')
        .expect(201);

      expect(response.body.bannerUrl).toBeDefined();
      expect(mockProfilesService.updateMerchantProfile).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(Object),
      );
    });
  });

  describe('GET /api/v1/merchant/gallery', () => {
    it('should get merchant gallery', async () => {
      mockProfilesService.getMerchantProfile.mockResolvedValue(mockProfile);

      const response = await request(app.getHttpServer())
        .get('/api/v1/merchant/gallery')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.gallery).toBeInstanceOf(Array);
      expect(mockProfilesService.getMerchantProfile).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('POST /api/v1/merchant/gallery', () => {
    it('should upload gallery photos', async () => {
      mockProfilesService.getMerchantProfile.mockResolvedValue(mockProfile);

      const response = await request(app.getHttpServer())
        .post('/api/v1/merchant/gallery')
        .attach('files', Buffer.from('photo1'), 'photo1.jpg')
        .attach('files', Buffer.from('photo2'), 'photo2.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockProfilesService.getMerchantProfile).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('DELETE /api/v1/merchant/gallery/:id', () => {
    it('should delete a gallery photo', async () => {
      mockProfilesService.getMerchantProfile.mockResolvedValue(mockProfile);

      const response = await request(app.getHttpServer())
        .delete('/api/v1/merchant/gallery/photo-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockProfilesService.getMerchantProfile).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });
});

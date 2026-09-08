import {
  INestApplication,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ProfileController } from '../src/profiles/controllers/profile.controller';
import { ProfilesService } from '../src/profiles/services/profiles.service';
import { UploadsService } from '../src/uploads/services/uploads.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

describe('ProfileController (e2e)', () => {
  let app: INestApplication<App>;

  const mockUser = { id: 'user-123' };
  const mockProfile = {
    id: 'profile-123',
    userId: mockUser.id,
    user: { 
      id: mockUser.id, 
      firstName: 'John', 
      lastName: 'Doe', 
      email: 'john@example.com', 
      role: 'CUSTOMER', 
      isEmailVerified: true, 
      isActive: true, 
      createdAt: new Date().toISOString()
    },
    bio: 'Test bio',
    preferredLanguage: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockProfilesService = {
    createCustomerProfile: jest.fn(),
    getCustomerProfile: jest.fn(),
    updateCustomerProfile: jest.fn(),
  };

  const mockUploadsService = {
    replaceFile: jest.fn(),
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        { provide: ProfilesService, useValue: mockProfilesService },
        { provide: UploadsService, useValue: mockUploadsService },
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

  describe('POST /api/v1/profile', () => {
    it('should create a profile', async () => {
      const createDto = { bio: 'Test bio', preferredLanguage: 'en' };
      mockProfilesService.createCustomerProfile.mockResolvedValue(mockProfile);

      const response = await request(app.getHttpServer())
        .post('/api/v1/profile')
        .send(createDto)
        .expect(201);

      // The ProfileResponseDto format will wrap in data? No wait, ProfileResponseDto might just be the object itself, or NestJS handles serialization.
      // Wait, let's just check the response body properties.
      expect(response.body).toEqual(expect.objectContaining({
        id: mockProfile.id,
        bio: mockProfile.bio
      }));
      expect(mockProfilesService.createCustomerProfile).toHaveBeenCalledWith(
        mockUser.id,
        createDto,
      );
    });
  });

  describe('GET /api/v1/profile', () => {
    it('should get a profile', async () => {
      mockProfilesService.getCustomerProfile.mockResolvedValue(mockProfile);

      const response = await request(app.getHttpServer())
        .get('/api/v1/profile')
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        id: mockProfile.id,
        bio: mockProfile.bio
      }));
      expect(mockProfilesService.getCustomerProfile).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('PUT /api/v1/profile', () => {
    it('should update a profile', async () => {
      const updateDto = { bio: 'Updated bio' };
      mockProfilesService.updateCustomerProfile.mockResolvedValue({
        ...mockProfile,
        ...updateDto,
      });

      const response = await request(app.getHttpServer())
        .put('/api/v1/profile')
        .send(updateDto)
        .expect(200);

      expect(response.body.bio).toEqual('Updated bio');
      expect(mockProfilesService.updateCustomerProfile).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
    });
  });

  describe('POST /api/v1/profile/avatar', () => {
    it('should upload an avatar', async () => {
      mockProfilesService.getCustomerProfile.mockResolvedValue(mockProfile);
      mockUploadsService.uploadFile.mockResolvedValue({
        fileUrl: 'https://cdn.example.com/uploads/avatars/user-123/test.jpg',
        key: 'uploads/avatars/user-123/test.jpg',
      });
      mockProfilesService.updateCustomerProfile.mockResolvedValue({
        ...mockProfile,
        avatarUrl: 'https://cdn.example.com/uploads/avatars/user-123/test.jpg',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/profile/avatar')
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(201);

      expect(response.body.avatarUrl).toBeDefined();
      expect(mockUploadsService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({ originalname: 'test.jpg', mimetype: 'image/jpeg' }),
        'avatar',
        mockUser.id,
      );
      expect(mockProfilesService.updateCustomerProfile).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          avatarUrl:
            'https://cdn.example.com/uploads/avatars/user-123/test.jpg',
        }),
      );
    });
  });
});

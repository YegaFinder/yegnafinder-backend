import {
  INestApplication,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminListingsController } from '../src/profiles/controllers/admin-listings.controller';
import { PublicListingsController } from '../src/profiles/controllers/public-listings.controller';
import { ListingApprovalService } from '../src/profiles/services/listing-approval.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { ListingStatus } from '../src/profiles/enums/listing-status.enum';

describe('Listing approval (e2e)', () => {
  let app: INestApplication<App>;
  let currentRole = 'Admin';

  const mockAdmin = { id: 'admin-123', role: 'Admin' };
  const mockListing = {
    id: 'biz-123',
    userId: 'merchant-123',
    user: {
      id: 'merchant-123',
      firstName: 'Ada',
      lastName: 'Merchant',
      email: 'ada@example.com',
      role: 'MERCHANT',
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    businessName: 'Ada Cafe',
    socialMedia: {},
    businessCategories: [],
    servicesOffered: [],
    businessHours: [],
    verificationStatus: 'pending',
    averageRating: 0,
    totalReviews: 0,
    isProfileComplete: true,
    isFeatured: false,
    listingStatus: ListingStatus.PENDING,
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockListingApprovalService = {
    listForOps: jest.fn(),
    listPublic: jest.fn(),
    getById: jest.fn(),
    getPublicById: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminListingsController, PublicListingsController],
      providers: [
        {
          provide: ListingApprovalService,
          useValue: mockListingApprovalService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { ...mockAdmin, role: currentRole };
          return true;
        },
      })
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
    currentRole = 'Admin';
    jest.clearAllMocks();
    await app.close();
  });

  it('GET /api/v1/admin/listings returns the pending queue', async () => {
    mockListingApprovalService.listForOps.mockResolvedValue([mockListing]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/listings?status=pending')
      .expect(200);

    expect(response.body.listings).toHaveLength(1);
    expect(mockListingApprovalService.listForOps).toHaveBeenCalledWith(
      ListingStatus.PENDING,
    );
  });

  it('POST /api/v1/admin/listings/:id/approve publishes the listing', async () => {
    mockListingApprovalService.approve.mockResolvedValue({
      ...mockListing,
      listingStatus: ListingStatus.APPROVED,
      isPublic: true,
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/listings/biz-123/approve')
      .expect(201);

    expect(response.body.isPublic).toBe(true);
    expect(response.body.listingStatus).toBe(ListingStatus.APPROVED);
    expect(mockListingApprovalService.approve).toHaveBeenCalledWith(
      'biz-123',
      mockAdmin.id,
    );
  });

  it('POST /api/v1/admin/listings/:id/reject requires a reason', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/listings/biz-123/reject')
      .send({})
      .expect(400);
  });

  it('rejects approval access for a non-admin user', async () => {
    currentRole = 'Customer';

    await request(app.getHttpServer())
      .get('/api/v1/admin/listings?status=pending')
      .expect(403);
  });

  it('GET /api/v1/listings returns only the public catalog', async () => {
    mockListingApprovalService.listPublic.mockResolvedValue([
      { ...mockListing, listingStatus: ListingStatus.APPROVED, isPublic: true },
    ]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/listings')
      .expect(200);

    expect(response.body.listings).toHaveLength(1);
    expect(mockListingApprovalService.listPublic).toHaveBeenCalled();
  });
});

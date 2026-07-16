import {
  INestApplication,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MerchantProfilesController } from '../src/profiles/controllers/merchant-profiles.controller';
import { ProfilesService } from '../src/profiles/services/profiles.service';
import { BusinessHoursService } from '../src/profiles/services/business-hours.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { DayOfWeek } from '../src/profiles/entities/business-hours.entity';

describe('MerchantProfilesController business hours (e2e)', () => {
  let app: INestApplication<App>;

  const merchantProfile = { id: 'profile-123', userId: 'merchant-123' };
  const businessHours = Object.values(DayOfWeek).map((day) => ({
    dayOfWeek: day,
    openTime: '09:00',
    closeTime: '17:00',
    isClosed: false,
    is24Hours: false,
  }));

  const mockProfilesService = {
    getMerchantProfile: jest.fn(),
  };

  const mockBusinessHoursService = {
    updateBusinessHours: jest.fn(),
    getBusinessHours: jest.fn(),
    isOpenNow: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MerchantProfilesController],
      providers: [
        { provide: ProfilesService, useValue: mockProfilesService },
        { provide: BusinessHoursService, useValue: mockBusinessHoursService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context
            .switchToHttp()
            .getRequest<{ user: { id: string } }>();
          req.user = { id: 'merchant-123' };
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

    mockProfilesService.getMerchantProfile.mockResolvedValue(merchantProfile);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('PUT /api/v1/profiles/merchant/business-hours updates business hours', async () => {
    mockBusinessHoursService.updateBusinessHours.mockResolvedValue(
      businessHours,
    );

    const response = await request(app.getHttpServer())
      .put('/api/v1/profiles/merchant/business-hours')
      .send({ businessHours })
      .expect(200);

    expect(response.body).toEqual({ success: true, businessHours });
    expect(mockBusinessHoursService.updateBusinessHours).toHaveBeenCalledWith(
      merchantProfile.id,
      businessHours,
    );
  });

  it('GET /api/v1/profiles/merchant/business-hours returns business hours', async () => {
    mockBusinessHoursService.getBusinessHours.mockResolvedValue(businessHours);

    const response = await request(app.getHttpServer())
      .get('/api/v1/profiles/merchant/business-hours')
      .expect(200);

    expect(response.body).toEqual({ businessHours });
    expect(mockBusinessHoursService.getBusinessHours).toHaveBeenCalledWith(
      merchantProfile.id,
    );
  });

  it('GET /api/v1/profiles/merchant/is-open returns open status', async () => {
    mockBusinessHoursService.isOpenNow.mockResolvedValue(true);

    const response = await request(app.getHttpServer())
      .get('/api/v1/profiles/merchant/is-open')
      .expect(200);

    expect(response.body).toEqual({ isOpen: true });
    expect(mockBusinessHoursService.isOpenNow).toHaveBeenCalledWith(
      merchantProfile.id,
    );
  });

  it('PUT /api/v1/profiles/merchant/business-hours rejects invalid time format', async () => {
    const invalidHours = businessHours.map((hours, index) =>
      index === 0 ? { ...hours, openTime: '25:00' } : hours,
    );

    await request(app.getHttpServer())
      .put('/api/v1/profiles/merchant/business-hours')
      .send({ businessHours: invalidHours })
      .expect(400);

    expect(mockBusinessHoursService.updateBusinessHours).not.toHaveBeenCalled();
  });
});

import {
  INestApplication,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { SavedPlacesController } from '../src/profiles/controllers/saved-places.controller';
import { SavedPlacesService } from '../src/profiles/services/saved-places.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';

describe('SavedPlacesController (e2e)', () => {
  let app: INestApplication<App>;

  const mockUser = { id: 'user-123' };
  const mockPlace = {
    id: 'place-123',
    userId: mockUser.id,
    label: 'Home',
    address: '123 Main St',
  };

  const mockSavedPlacesService = {
    getSavedPlaces: jest.fn(),
    addSavedPlace: jest.fn(),
    removeSavedPlace: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SavedPlacesController],
      providers: [
        { provide: SavedPlacesService, useValue: mockSavedPlacesService },
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

  describe('GET /api/v1/saved-places', () => {
    it('should get all saved places', async () => {
      mockSavedPlacesService.getSavedPlaces.mockResolvedValue([mockPlace]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/saved-places')
        .expect(200);

      expect(response.body).toEqual([mockPlace]);
      expect(mockSavedPlacesService.getSavedPlaces).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('POST /api/v1/saved-places', () => {
    it('should add a saved place', async () => {
      const dto = { label: 'Home', address: '123 Main St' };
      mockSavedPlacesService.addSavedPlace.mockResolvedValue(mockPlace);

      const response = await request(app.getHttpServer())
        .post('/api/v1/saved-places')
        .send(dto)
        .expect(201);

      expect(response.body).toEqual(mockPlace);
      expect(mockSavedPlacesService.addSavedPlace).toHaveBeenCalledWith(
        mockUser.id,
        dto.label,
        dto.address,
        undefined,
        undefined,
      );
    });
  });

  describe('DELETE /api/v1/saved-places/:id', () => {
    it('should remove a saved place', async () => {
      mockSavedPlacesService.removeSavedPlace.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/api/v1/saved-places/place-123')
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(mockSavedPlacesService.removeSavedPlace).toHaveBeenCalledWith(
        mockUser.id,
        'place-123',
      );
    });
  });
});

import {
  INestApplication,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { FavoritesController } from '../src/profiles/controllers/favorites.controller';
import { FavoritesService } from '../src/profiles/services/favorites.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';

describe('FavoritesController (e2e)', () => {
  let app: INestApplication<App>;

  const mockUser = { id: 'user-123' };
  const mockFavorite = {
    id: 'fav-123',
    userId: mockUser.id,
    businessId: 'business-456',
  };

  const mockFavoritesService = {
    getFavorites: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        { provide: FavoritesService, useValue: mockFavoritesService },
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

  describe('GET /api/v1/favorites', () => {
    it('should get all favorites', async () => {
      mockFavoritesService.getFavorites.mockResolvedValue([mockFavorite]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/favorites')
        .expect(200);

      expect(response.body).toEqual([mockFavorite]);
      expect(mockFavoritesService.getFavorites).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('POST /api/v1/favorites', () => {
    it('should add a favorite', async () => {
      const dto = { businessId: 'business-456' };
      mockFavoritesService.addFavorite.mockResolvedValue(mockFavorite);

      const response = await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .send(dto)
        .expect(201);

      expect(response.body).toEqual(mockFavorite);
      expect(mockFavoritesService.addFavorite).toHaveBeenCalledWith(
        mockUser.id,
        dto.businessId,
      );
    });
  });

  describe('DELETE /api/v1/favorites/:businessId', () => {
    it('should remove a favorite', async () => {
      mockFavoritesService.removeFavorite.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/api/v1/favorites/business-456')
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(mockFavoritesService.removeFavorite).toHaveBeenCalledWith(
        mockUser.id,
        'business-456',
      );
    });
  });
});

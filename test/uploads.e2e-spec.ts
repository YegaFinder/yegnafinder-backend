import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { UploadsController } from '../src/uploads/controllers/uploads.controller';
import { UploadsService, UploadType } from '../src/uploads/services/uploads.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';

describe('UploadsController (e2e)', () => {
  let app: INestApplication<App>;

  const mockUploadsService = {
    generatePresignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [{ provide: UploadsService, useValue: mockUploadsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = { sub: 'user-123' };
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

  it('POST /api/v1/uploads/presign returns presigned upload details', async () => {
    mockUploadsService.generatePresignedUrl.mockResolvedValue({
      uploadUrl: 'https://s3.example.com/upload',
      fileUrl: 'https://cdn.example.com/uploads/avatars/user-123/file.jpg',
      key: 'uploads/avatars/user-123/file.jpg',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/uploads/presign')
      .send({
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
        uploadType: UploadType.AVATAR,
      })
      .expect(201);

    expect(response.body).toEqual({
      uploadUrl: 'https://s3.example.com/upload',
      fileUrl: 'https://cdn.example.com/uploads/avatars/user-123/file.jpg',
      key: 'uploads/avatars/user-123/file.jpg',
    });
    expect(mockUploadsService.generatePresignedUrl).toHaveBeenCalledWith(
      'avatar.jpg',
      'image/jpeg',
      UploadType.AVATAR,
      'user-123',
    );
  });

  it('POST /api/v1/uploads/presign rejects invalid content type', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/uploads/presign')
      .send({
        filename: 'file.txt',
        contentType: 'text/plain',
        uploadType: UploadType.AVATAR,
      })
      .expect(400);

    expect(mockUploadsService.generatePresignedUrl).not.toHaveBeenCalled();
  });
});

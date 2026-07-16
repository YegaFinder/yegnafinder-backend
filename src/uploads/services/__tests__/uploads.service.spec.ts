import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UploadsService, UploadType } from '../uploads.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue('https://s3.example.com/presigned-url'),
}));

describe('UploadsService', () => {
  let service: UploadsService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock configuration values
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      const config = {
        'aws.region': 'us-east-1',
        'aws.accessKeyId': 'test-key',
        'aws.secretAccessKey': 'test-secret',
        'aws.s3Bucket': 'test-bucket',
        'aws.cdnUrl': 'https://cdn.example.com',
      };
      return config[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePresignedUrl', () => {
    it('should throw BadRequestException for invalid content type', async () => {
      await expect(
        service.generatePresignedUrl(
          'test.txt',
          'text/plain',
          UploadType.AVATAR,
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid image content types for avatar', async () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

      for (const contentType of validTypes) {
        const result = await service.generatePresignedUrl(
          'test.jpg',
          contentType,
          UploadType.AVATAR,
          'user-123',
        );
        expect(result.uploadUrl).toBe('https://s3.example.com/presigned-url');
        expect(result.fileUrl).toContain('uploads/avatars/user-123/');
        expect(result.key).toContain('uploads/avatars/user-123/');
      }

      expect(getSignedUrl).toHaveBeenCalled();
    });
  });
});

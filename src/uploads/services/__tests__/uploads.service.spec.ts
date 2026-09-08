import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UploadsService, UploadType } from '../uploads.service';

const mockSend = jest.fn();

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue('https://s3.example.com/presigned-url'),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: (...args: unknown[]) => mockSend(...args),
  })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
  DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

describe('UploadsService', () => {
  let service: UploadsService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const config: Record<string, string> = {
    'aws.region': 'us-east-1',
    'aws.accessKeyId': 'test-key',
    'aws.secretAccessKey': 'test-secret',
    'aws.s3Bucket': 'test-bucket',
    'aws.cdnUrl': 'https://cdn.example.com',
  };

  beforeEach(async () => {
    mockConfigService.get.mockImplementation((key: string) => config[key]);
    mockSend.mockResolvedValue({});

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

  describe('uploadFile', () => {
    const file = {
      originalname: 'logo.png',
      mimetype: 'image/png',
      buffer: Buffer.from('image-bytes'),
      size: 11,
    };

    it('should upload a file to S3 and return the public URL', async () => {
      const result = await service.uploadFile(file, UploadType.LOGO, 'user-123');

      expect(mockSend).toHaveBeenCalled();
      expect(result.key).toContain('uploads/logos/user-123/');
      expect(result.key).toMatch(/\.png$/);
      expect(result.fileUrl).toBe(
        `https://cdn.example.com/${result.key}`,
      );
      expect(mockSend.mock.calls[0][0].input).toMatchObject({
        Bucket: 'test-bucket',
        Key: result.key,
        Body: file.buffer,
        ContentType: 'image/png',
      });
    });

    it.each([
      [UploadType.AVATAR, 'uploads/avatars/user-123/'],
      [UploadType.LOGO, 'uploads/logos/user-123/'],
      [UploadType.BANNER, 'uploads/banners/user-123/'],
      [UploadType.GALLERY, 'uploads/gallery/user-123/'],
    ])('uses the correct object folder for %s', async (uploadType, folder) => {
      const result = await service.uploadFile(file, uploadType, 'user-123');

      expect(result.key).toContain(folder);
    });

    it('should reject missing files', async () => {
      await expect(
        service.uploadFile(undefined, UploadType.BANNER, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject files over the size limit', async () => {
      await expect(
        service.uploadFile(
          { ...file, size: 5 * 1024 * 1024 + 1 },
          UploadType.AVATAR,
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should translate an S3 upload failure without exposing provider details', async () => {
      mockSend.mockRejectedValueOnce(new Error('AWS credentials leaked here'));

      await expect(
        service.uploadFile(file, UploadType.BANNER, 'user-123'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should reject when the bucket is not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) =>
        key === 'aws.s3Bucket' ? '' : config[key],
      );

      await expect(
        service.uploadFile(file, UploadType.GALLERY, 'user-123'),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('deleteFile', () => {
    it('should delete by object key extracted from a public URL', async () => {
      await service.deleteFile(
        'https://cdn.example.com/uploads/avatars/user-123/file.jpg',
      );

      expect(mockSend).toHaveBeenCalled();
    });

    it('should no-op for unrecognized URLs', async () => {
      await service.deleteFile('https://example.com/not-ours.jpg');
      expect(mockSend).not.toHaveBeenCalled();
    });
  });
});

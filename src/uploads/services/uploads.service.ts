import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extension } from 'mime-types';
import { randomUUID } from 'crypto';

export enum UploadType {
  AVATAR = 'avatar',
  LOGO = 'logo',
  BANNER = 'banner',
  DOCUMENT = 'document',
}

@Injectable()
export class UploadsService {
  private s3Client: S3Client;
  private bucket: string;
  private cdnUrl: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('aws.region') ?? 'us-east-1';
    const accessKeyId = this.configService.get<string>('aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>(
      'aws.secretAccessKey',
    );

    this.s3Client = new S3Client({
      region,
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
    this.bucket = this.configService.get<string>('aws.s3Bucket') ?? '';
    this.cdnUrl = this.configService.get<string>('aws.cdnUrl') ?? '';
  }

  async generatePresignedUrl(
    filename: string,
    contentType: string,
    uploadType: UploadType,
    userId: string,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    // Validate content type
    const allowedTypes = this.getAllowedContentTypes(uploadType);
    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException(
        `Invalid content type for ${uploadType}. Allowed: ${allowedTypes.join(', ')}`,
      );
    }

    // Generate unique file key
    const fileExtension = this.getFileExtension(filename, contentType);
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    const key = `uploads/${uploadType}s/${userId}/${uniqueFilename}`;

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      Metadata: {
        userId,
        uploadType,
        originalFilename: filename,
      },
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    }); // 1 hour
    const fileUrl = this.cdnUrl
      ? `${this.cdnUrl}/${key}`
      : `https://${this.bucket}.s3.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  private getAllowedContentTypes(uploadType: UploadType): string[] {
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const documentTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    switch (uploadType) {
      case UploadType.AVATAR:
      case UploadType.LOGO:
      case UploadType.BANNER:
        return imageTypes;
      case UploadType.DOCUMENT:
        return documentTypes;
      default:
        return imageTypes;
    }
  }

  private getFileExtension(filename: string, contentType: string): string {
    // Try to get extension from filename first
    const extensionMatch = filename.match(/\.[^.]+$/);
    if (extensionMatch) {
      return extensionMatch[0];
    }

    // Fallback to mime type
    const ext = extension(contentType);
    return ext ? `.${ext}` : '.jpg';
  }

  deleteFile(key: string): Promise<void> {
    void key;
    return Promise.resolve();
  }
}

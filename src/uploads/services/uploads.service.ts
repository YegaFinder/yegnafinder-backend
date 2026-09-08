import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extension } from 'mime-types';
import { randomUUID } from 'crypto';
import { MAX_IMAGE_UPLOAD_BYTES } from '../upload-limits';

export enum UploadType {
  AVATAR = 'avatar',
  LOGO = 'logo',
  BANNER = 'banner',
  GALLERY = 'gallery',
  DOCUMENT = 'document',
}

export interface UploadedFileInput {
  originalname: string;
  mimetype: string;
  buffer?: Buffer;
  size?: number;
}

export interface StoredUpload {
  uploadUrl?: string;
  fileUrl: string;
  key: string;
}

const FOLDER_BY_TYPE: Record<UploadType, string> = {
  [UploadType.AVATAR]: 'avatars',
  [UploadType.LOGO]: 'logos',
  [UploadType.BANNER]: 'banners',
  [UploadType.GALLERY]: 'gallery',
  [UploadType.DOCUMENT]: 'documents',
};

@Injectable()
export class UploadsService {
  private s3Client: S3Client;

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
  }

  async generatePresignedUrl(
    filename: string,
    contentType: string,
    uploadType: UploadType,
    userId: string,
    fileSize?: number,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    this.assertAllowedContentType(uploadType, contentType);
    if (fileSize !== undefined && fileSize > MAX_IMAGE_UPLOAD_BYTES) {
      throw new BadRequestException(
        `File exceeds the ${MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024)}MB limit`,
      );
    }
    const key = this.buildObjectKey(filename, contentType, uploadType, userId);

    const command = new PutObjectCommand({
      Bucket: this.requireBucket(),
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
    });

    return { uploadUrl, fileUrl: this.publicUrlForKey(key), key };
  }

  async uploadFile(
    file: UploadedFileInput | undefined,
    uploadType: UploadType,
    userId: string,
  ): Promise<StoredUpload> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('A file is required');
    }

    this.assertAllowedContentType(uploadType, file.mimetype);

    const size = file.size ?? file.buffer.length;
    if (size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new BadRequestException(
        `File exceeds the ${MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024)}MB limit`,
      );
    }

    const key = this.buildObjectKey(
      file.originalname,
      file.mimetype,
      uploadType,
      userId,
    );
    const bucket = this.requireBucket();

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            userId,
            uploadType,
            originalFilename: file.originalname,
          },
        }),
      );
    } catch {
      throw new InternalServerErrorException('File upload failed');
    }

    return { fileUrl: this.publicUrlForKey(key), key };
  }

  async replaceFile(
    previousUrlOrKey: string | undefined,
    file: UploadedFileInput | undefined,
    uploadType: UploadType,
    userId: string,
  ): Promise<StoredUpload> {
    const uploaded = await this.uploadFile(file, uploadType, userId);
    if (previousUrlOrKey) {
      await this.deleteFile(previousUrlOrKey);
    }
    return uploaded;
  }

  async deleteFile(urlOrKey: string): Promise<void> {
    const key = this.extractKey(urlOrKey);
    if (!key) {
      return;
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.requireBucket(),
          Key: key,
        }),
      );
    } catch {
      // Best-effort cleanup so a missing object does not block profile updates.
    }
  }

  extractKey(urlOrKey: string): string | null {
    if (!urlOrKey) {
      return null;
    }

    if (!urlOrKey.includes('://')) {
      return urlOrKey.startsWith('uploads/') ? urlOrKey : null;
    }

    try {
      const { pathname } = new URL(urlOrKey);
      const key = decodeURIComponent(pathname.replace(/^\/+/, ''));
      return key.startsWith('uploads/') ? key : null;
    } catch {
      return null;
    }
  }

  private buildObjectKey(
    filename: string,
    contentType: string,
    uploadType: UploadType,
    userId: string,
  ): string {
    const fileExtension = this.getFileExtension(filename, contentType);
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    return `uploads/${FOLDER_BY_TYPE[uploadType]}/${userId}/${uniqueFilename}`;
  }

  private publicUrlForKey(key: string): string {
    const cdnUrl = this.configService.get<string>('aws.cdnUrl') ?? '';
    const bucket = this.requireBucket();
    return cdnUrl
      ? `${cdnUrl.replace(/\/$/, '')}/${key}`
      : `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  private requireBucket(): string {
    const bucket = this.configService.get<string>('aws.s3Bucket') ?? '';
    if (!bucket) {
      throw new ServiceUnavailableException(
        'File storage is not configured (AWS_S3_BUCKET)',
      );
    }
    return bucket;
  }

  private assertAllowedContentType(
    uploadType: UploadType,
    contentType: string,
  ): void {
    const allowedTypes = this.getAllowedContentTypes(uploadType);
    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException(
        `Invalid content type for ${uploadType}. Allowed: ${allowedTypes.join(', ')}`,
      );
    }
  }

  private getAllowedContentTypes(uploadType: UploadType): string[] {
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const documentTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    switch (uploadType) {
      case UploadType.DOCUMENT:
        return documentTypes;
      default:
        return imageTypes;
    }
  }

  private getFileExtension(filename: string, contentType: string): string {
    const ext = extension(contentType);
    return ext ? `.${ext}` : '.jpg';
  }
}

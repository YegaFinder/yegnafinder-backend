import { IsString, IsEnum, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UploadType } from '../services/uploads.service';

export class PresignedUrlRequestDto {
  @ApiProperty({ example: 'profile-picture.jpg' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @Matches(/^(image\/(jpeg|png|webp)|application\/pdf)$/, {
    message:
      'Content type must be image/jpeg, image/png, image/webp, or application/pdf',
  })
  contentType: string;

  @ApiProperty({ enum: UploadType, example: UploadType.AVATAR })
  @IsEnum(UploadType)
  uploadType: UploadType;
}

export class PresignedUrlResponseDto {
  @ApiProperty({ example: 'https://s3.amazonaws.com/bucket/presigned-url' })
  uploadUrl: string;

  @ApiProperty({
    example: 'https://cdn.example.com/uploads/avatars/user123/file.jpg',
  })
  fileUrl: string;

  @ApiProperty({ example: 'uploads/avatars/user123/uuid-file.jpg' })
  key: string;
}

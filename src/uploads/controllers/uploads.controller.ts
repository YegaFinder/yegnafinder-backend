import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadsService } from '../services/uploads.service';
import { PresignedUrlRequestDto, PresignedUrlResponseDto } from '../dto/presigned-url.dto';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Generate presigned URL for file upload' })
  @ApiResponse({ status: 201, type: PresignedUrlResponseDto })
  async generatePresignedUrl(
    @Request() req,
    @Body() dto: PresignedUrlRequestDto,
  ): Promise<PresignedUrlResponseDto> {
    const userId = req.user.sub;
    const result = await this.uploadsService.generatePresignedUrl(
      dto.filename,
      dto.contentType,
      dto.uploadType,
      userId,
    );

    return {
      uploadUrl: result.uploadUrl,
      fileUrl: result.fileUrl,
      key: result.key,
    };
  }
}

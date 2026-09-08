import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { ProfilesService } from '../services/profiles.service';
import {
  CreateBusinessDto,
  UpdateBusinessDto,
} from '../dto/create-business.dto';
import { BusinessResponseDto } from '../dto/business-response.dto';
import { BusinessHoursService } from '../services/business-hours.service';
import { UpdateBusinessHoursDto } from '../dto/business-hours.dto';
import { BusinessGalleryService } from '../services/business-gallery.service';
import { ListingApprovalService } from '../services/listing-approval.service';
import { UploadsService, UploadType } from '../../uploads/services/uploads.service';
import type { UploadedFileInput } from '../../uploads/services/uploads.service';
import { IMAGE_UPLOAD_INTERCEPTOR_OPTIONS } from '../../uploads/upload-limits';
import { SubmitListingDto } from '../dto/listing-approval.dto';

@ApiTags('Merchant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MERCHANT)
@Controller('merchant')
export class MerchantController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly businessHoursService: BusinessHoursService,
    private readonly galleryService: BusinessGalleryService,
    private readonly listingApprovalService: ListingApprovalService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post('profile')
  @ApiOperation({ summary: 'Create business profile' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateBusinessDto,
  ): Promise<BusinessResponseDto> {
    const profile = await this.profilesService.createMerchantProfile(user.id, dto);
    return new BusinessResponseDto(profile);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get business profile' })
  async findOne(@CurrentUser() user: User): Promise<BusinessResponseDto> {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    return new BusinessResponseDto(profile);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update business profile' })
  async update(
    @CurrentUser() user: User,
    @Body() dto: UpdateBusinessDto,
  ): Promise<BusinessResponseDto> {
    const profile = await this.profilesService.updateMerchantProfile(user.id, dto);
    return new BusinessResponseDto(profile);
  }

  @Post('listing/submit')
  @ApiOperation({
    summary: 'Submit the business listing for admin approval',
  })
  async submitListing(
    @CurrentUser() user: User,
    @Body() _dto: SubmitListingDto,
  ): Promise<BusinessResponseDto> {
    const profile = await this.listingApprovalService.submitForApproval(user.id);
    return new BusinessResponseDto(profile);
  }

  @Put('business-hours')
  @ApiOperation({ summary: 'Update merchant business hours' })
  async updateBusinessHours(
    @CurrentUser() user: User,
    @Body() dto: UpdateBusinessHoursDto,
  ): Promise<any> {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    const businessHours = await this.businessHoursService.updateBusinessHours(profile.id, dto.businessHours);
    return { success: true, businessHours };
  }

  @Get('business-hours')
  @ApiOperation({ summary: 'Get merchant business hours' })
  async getBusinessHours(@CurrentUser() user: User): Promise<any> {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    const businessHours = await this.businessHoursService.getBusinessHours(profile.id);
    return { businessHours };
  }

  @Post('logo')
  @ApiOperation({ summary: 'Upload business logo to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_INTERCEPTOR_OPTIONS))
  async uploadLogo(
    @CurrentUser() user: User,
    @UploadedFile() file: UploadedFileInput,
  ): Promise<BusinessResponseDto> {
    if (!file) {
      throw new BadRequestException('A file is required');
    }
    const profile = await this.profilesService.getMerchantProfile(user.id);
    const previousLogoUrl = profile.logoUrl;
    const uploaded = await this.uploadsService.uploadFile(
      file,
      UploadType.LOGO,
      user.id,
    );
    let updated: BusinessResponseDto;
    try {
      updated = new BusinessResponseDto(
        await this.profilesService.updateMerchantProfile(user.id, {
          logoUrl: uploaded.fileUrl,
        }),
      );
    } catch (error) {
      await this.uploadsService.deleteFile(uploaded.key);
      throw error;
    }
    if (previousLogoUrl) {
      await this.uploadsService.deleteFile(previousLogoUrl);
    }
    return updated;
  }

  @Post('banner')
  @ApiOperation({ summary: 'Upload business banner to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_INTERCEPTOR_OPTIONS))
  async uploadBanner(
    @CurrentUser() user: User,
    @UploadedFile() file: UploadedFileInput,
  ): Promise<BusinessResponseDto> {
    if (!file) {
      throw new BadRequestException('A file is required');
    }
    const profile = await this.profilesService.getMerchantProfile(user.id);
    const previousBannerUrl = profile.bannerUrl;
    const uploaded = await this.uploadsService.uploadFile(
      file,
      UploadType.BANNER,
      user.id,
    );
    let updated: BusinessResponseDto;
    try {
      updated = new BusinessResponseDto(
        await this.profilesService.updateMerchantProfile(user.id, {
          bannerUrl: uploaded.fileUrl,
        }),
      );
    } catch (error) {
      await this.uploadsService.deleteFile(uploaded.key);
      throw error;
    }
    if (previousBannerUrl) {
      await this.uploadsService.deleteFile(previousBannerUrl);
    }
    return updated;
  }

  @Get('gallery')
  @ApiOperation({ summary: 'Get business gallery' })
  async getGallery(@CurrentUser() user: User): Promise<any> {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    const gallery = await this.galleryService.getGallery(profile.id);
    return { success: true, gallery };
  }

  @Post('gallery')
  @ApiOperation({ summary: 'Upload business gallery photos to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10, IMAGE_UPLOAD_INTERCEPTOR_OPTIONS))
  async uploadGallery(
    @CurrentUser() user: User,
    @UploadedFiles() files: Array<UploadedFileInput>,
  ): Promise<any> {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    const gallery = await this.galleryService.uploadPhotos(
      profile.id,
      user.id,
      files,
    );
    return { success: true, message: 'Photos uploaded successfully', gallery };
  }

  @Delete('gallery/:id')
  @ApiOperation({ summary: 'Delete a gallery photo' })
  async deleteGalleryPhoto(
    @CurrentUser() user: User,
    @Param('id') photoId: string,
  ): Promise<any> {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    await this.galleryService.deletePhoto(profile.id, photoId);
    return { success: true, message: 'Photo deleted successfully' };
  }
}

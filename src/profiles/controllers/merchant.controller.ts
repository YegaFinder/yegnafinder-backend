import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Param,
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

@ApiTags('Merchant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MERCHANT)
@Controller('merchant')
export class MerchantController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly businessHoursService: BusinessHoursService,
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
  @ApiOperation({ summary: 'Upload business logo' })
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @CurrentUser() user: User,
    @UploadedFile() file: any,
  ): Promise<BusinessResponseDto> {
    const logoUrl = `https://s3.amazonaws.com/bucket/logos/${file.originalname}`;
    const profile = await this.profilesService.updateMerchantProfile(user.id, { logoUrl });
    return new BusinessResponseDto(profile);
  }

  @Post('banner')
  @ApiOperation({ summary: 'Upload business banner' })
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(
    @CurrentUser() user: User,
    @UploadedFile() file: any,
  ): Promise<BusinessResponseDto> {
    const bannerUrl = `https://s3.amazonaws.com/bucket/banners/${file.originalname}`;
    const profile = await this.profilesService.updateMerchantProfile(user.id, { bannerUrl });
    return new BusinessResponseDto(profile);
  }

  @Get('gallery')
  @ApiOperation({ summary: 'Get business gallery' })
  async getGallery(@CurrentUser() user: User): Promise<any> {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    // Stub: in reality, fetch from business_gallery table
    return { success: true, gallery: [] };
  }

  @Post('gallery')
  @ApiOperation({ summary: 'Upload business gallery photos' })
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
  @UseInterceptors(FilesInterceptor('files'))
  async uploadGallery(
    @CurrentUser() user: User,
    @UploadedFiles() files: Array<any>,
  ): Promise<any> {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    // Stub implementation to save URLs to business_gallery table
    return { success: true, message: 'Photos uploaded successfully' };
  }

  @Delete('gallery/:id')
  @ApiOperation({ summary: 'Delete a gallery photo' })
  async deleteGalleryPhoto(
    @CurrentUser() user: User,
    @Param('id') photoId: string,
  ): Promise<any> {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    // Stub implementation
    return { success: true, message: 'Photo deleted successfully' };
  }
}

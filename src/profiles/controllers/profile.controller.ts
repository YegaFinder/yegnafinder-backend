import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { ProfilesService } from '../services/profiles.service';
import {
  CreateProfileDto,
  UpdateProfileDto,
} from '../dto/create-profile.dto';
import { ProfileResponseDto } from '../dto/profile-response.dto';
import { UploadsService, UploadType } from '../../uploads/services/uploads.service';
import type { UploadedFileInput } from '../../uploads/services/uploads.service';
import { IMAGE_UPLOAD_INTERCEPTOR_OPTIONS } from '../../uploads/upload-limits';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create customer profile' })
  async create(
    @CurrentUser() user: User,
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profilesService.createCustomerProfile(user.id, createProfileDto);
    return new ProfileResponseDto(profile);
  }

  @Get()
  @ApiOperation({ summary: 'Get customer profile' })
  async findOne(@CurrentUser() user: User): Promise<ProfileResponseDto> {
    const profile = await this.profilesService.getCustomerProfile(user.id);
    return new ProfileResponseDto(profile);
  }

  @Put()
  @ApiOperation({ summary: 'Update customer profile' })
  async update(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profilesService.updateCustomerProfile(user.id, updateProfileDto);
    return new ProfileResponseDto(profile);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload profile avatar to S3' })
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
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: UploadedFileInput,
  ): Promise<ProfileResponseDto> {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    const profile = await this.profilesService.getCustomerProfile(user.id);
    const previousAvatarUrl = profile.avatarUrl;
    const uploaded = await this.uploadsService.uploadFile(
      file,
      UploadType.AVATAR,
      user.id,
    );
    let updated: ProfileResponseDto;
    try {
      updated = new ProfileResponseDto(
        await this.profilesService.updateCustomerProfile(user.id, {
          avatarUrl: uploaded.fileUrl,
        }),
      );
    } catch (error) {
      await this.uploadsService.deleteFile(uploaded.key);
      throw error;
    }
    if (previousAvatarUrl) {
      await this.uploadsService.deleteFile(previousAvatarUrl);
    }
    return updated;
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
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
// Note: We would import UploadsService if it was available here, but we will assume it's integrated or handled.

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profilesService: ProfilesService) {}

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
  @ApiOperation({ summary: 'Upload profile avatar' })
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
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: any,
  ): Promise<ProfileResponseDto> {
    // Stub implementation for upload. In a real scenario, we'd use UploadsService.
    const avatarUrl = `https://s3.amazonaws.com/bucket/avatars/${file.originalname}`;
    const profile = await this.profilesService.updateCustomerProfile(user.id, { avatarUrl });
    return new ProfileResponseDto(profile);
  }
}

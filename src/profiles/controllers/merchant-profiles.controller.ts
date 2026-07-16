import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { ProfilesService } from '../services/profiles.service';
import {
  CreateMerchantProfileDto,
  UpdateMerchantProfileDto,
} from '../dto/create-merchant-profile.dto';
import { MerchantProfileResponseDto } from '../dto/merchant-profile-response.dto';
import { BusinessHoursService } from '../services/business-hours.service';
import { UpdateBusinessHoursDto } from '../dto/business-hours.dto';

@ApiTags('Merchant Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MERCHANT)
@Controller('profiles/merchant')
export class MerchantProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly businessHoursService: BusinessHoursService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create merchant profile' })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createProfileDto: CreateMerchantProfileDto,
  ): Promise<MerchantProfileResponseDto> {
    const profile = await this.profilesService.createMerchantProfile(
      req.user.id,
      createProfileDto,
    );
    return new MerchantProfileResponseDto(profile);
  }

  @Get()
  @ApiOperation({ summary: 'Get merchant profile' })
  async findOne(
    @Request() req: AuthenticatedRequest,
  ): Promise<MerchantProfileResponseDto> {
    const profile = await this.profilesService.getMerchantProfile(req.user.id);
    return new MerchantProfileResponseDto(profile);
  }

  @Put()
  @ApiOperation({ summary: 'Update merchant profile' })
  async update(
    @Request() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateMerchantProfileDto,
  ): Promise<MerchantProfileResponseDto> {
    const profile = await this.profilesService.updateMerchantProfile(
      req.user.id,
      updateProfileDto,
    );
    return new MerchantProfileResponseDto(profile);
  }

  @Put('business-hours')
  @ApiOperation({ summary: 'Update merchant business hours' })
  async updateBusinessHours(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateBusinessHoursDto,
  ): Promise<any> {
    const profile = await this.profilesService.getMerchantProfile(req.user.id);
    const businessHours = await this.businessHoursService.updateBusinessHours(
      profile.id,
      dto.businessHours,
    );
    return { success: true, businessHours };
  }

  @Get('business-hours')
  @ApiOperation({ summary: 'Get merchant business hours' })
  async getBusinessHours(@Request() req: AuthenticatedRequest): Promise<any> {
    const profile = await this.profilesService.getMerchantProfile(req.user.id);
    const businessHours = await this.businessHoursService.getBusinessHours(
      profile.id,
    );
    return { businessHours };
  }

  @Get('is-open')
  @ApiOperation({ summary: 'Check if merchant is currently open' })
  async isOpen(@Request() req: AuthenticatedRequest): Promise<any> {
    const profile = await this.profilesService.getMerchantProfile(req.user.id);
    const isOpen = await this.businessHoursService.isOpenNow(profile.id);
    return { isOpen };
  }
}

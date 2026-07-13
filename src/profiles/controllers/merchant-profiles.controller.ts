import { Controller, Get, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ProfilesService } from '../services/profiles.service';
import { CreateMerchantProfileDto, UpdateMerchantProfileDto } from '../dto/create-merchant-profile.dto';
import { MerchantProfileResponseDto } from '../dto/merchant-profile-response.dto';

@ApiTags('Merchant Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MERCHANT)
@Controller('profiles/merchant')
export class MerchantProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create merchant profile' })
  async create(
    @Request() req,
    @Body() createProfileDto: CreateMerchantProfileDto,
  ): Promise<MerchantProfileResponseDto> {
    const profile = await this.profilesService.createMerchantProfile(req.user.sub, createProfileDto);
    return new MerchantProfileResponseDto(profile);
  }

  @Get()
  @ApiOperation({ summary: 'Get merchant profile' })
  async findOne(@Request() req): Promise<MerchantProfileResponseDto> {
    const profile = await this.profilesService.getMerchantProfile(req.user.sub);
    return new MerchantProfileResponseDto(profile);
  }

  @Put()
  @ApiOperation({ summary: 'Update merchant profile' })
  async update(
    @Request() req,
    @Body() updateProfileDto: UpdateMerchantProfileDto,
  ): Promise<MerchantProfileResponseDto> {
    const profile = await this.profilesService.updateMerchantProfile(req.user.sub, updateProfileDto);
    return new MerchantProfileResponseDto(profile);
  }

  // Note: Business hours endpoints will be added by Developer 2
  // @Put('business-hours') - Update business hours
  // @Get('business-hours') - Get business hours  
  // @Get('is-open') - Check if currently open
}
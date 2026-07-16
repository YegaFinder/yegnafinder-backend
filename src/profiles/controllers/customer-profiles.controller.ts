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
  CreateCustomerProfileDto,
  UpdateCustomerProfileDto,
} from '../dto/create-customer-profile.dto';
import { CustomerProfileResponseDto } from '../dto/customer-profile-response.dto';

@ApiTags('Customer Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Controller('profiles/customer')
export class CustomerProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create customer profile' })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createProfileDto: CreateCustomerProfileDto,
  ): Promise<CustomerProfileResponseDto> {
    const profile = await this.profilesService.createCustomerProfile(
      req.user.id,
      createProfileDto,
    );
    return new CustomerProfileResponseDto(profile);
  }

  @Get()
  @ApiOperation({ summary: 'Get customer profile' })
  async findOne(
    @Request() req: AuthenticatedRequest,
  ): Promise<CustomerProfileResponseDto> {
    const profile = await this.profilesService.getCustomerProfile(req.user.id);
    return new CustomerProfileResponseDto(profile);
  }

  @Put()
  @ApiOperation({ summary: 'Update customer profile' })
  async update(
    @Request() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateCustomerProfileDto,
  ): Promise<CustomerProfileResponseDto> {
    const profile = await this.profilesService.updateCustomerProfile(
      req.user.id,
      updateProfileDto,
    );
    return new CustomerProfileResponseDto(profile);
  }
}

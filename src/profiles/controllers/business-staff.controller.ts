import { Controller, Get, Post, Delete, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { BusinessStaffService } from '../services/business-staff.service';
import { ProfilesService } from '../services/profiles.service';

@ApiTags('Business Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MERCHANT)
@Controller('merchant/staff')
export class BusinessStaffController {
  constructor(
    private readonly staffService: BusinessStaffService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all business staff' })
  async getStaff(@CurrentUser() user: User) {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    return this.staffService.getStaff(profile.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new staff member' })
  async addStaff(@CurrentUser() user: User, @Body() data: { userId: string; role: string }) {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    return this.staffService.addStaff(profile.id, data.userId, data.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a staff member' })
  async removeStaff(@CurrentUser() user: User, @Param('id') id: string) {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    await this.staffService.removeStaff(profile.id, id);
    return { success: true };
  }
}

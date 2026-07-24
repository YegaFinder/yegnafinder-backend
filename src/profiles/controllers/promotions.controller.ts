import { Controller, Get, Post, Delete, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { PromotionsService } from '../services/promotions.service';
import { ProfilesService } from '../services/profiles.service';

@ApiTags('Promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MERCHANT)
@Controller('merchant/promotions')
export class PromotionsController {
  constructor(
    private readonly promotionsService: PromotionsService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all business promotions' })
  async getPromotions(@CurrentUser() user: User) {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    return this.promotionsService.getPromotions(profile.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new promotion' })
  async addPromotion(@CurrentUser() user: User, @Body() data: any) {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    return this.promotionsService.addPromotion(profile.id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a promotion' })
  async removePromotion(@CurrentUser() user: User, @Param('id') id: string) {
    const profile = await this.profilesService.getMerchantProfile(user.id);
    await this.promotionsService.removePromotion(profile.id, id);
    return { success: true };
  }
}

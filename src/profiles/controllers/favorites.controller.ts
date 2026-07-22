import { Controller, Get, Post, Delete, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { FavoritesService } from '../services/favorites.service';

class AddFavoriteDto {
  @ApiProperty()
  businessId: string;
}

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user favorites' })
  async getFavorites(@CurrentUser() user: User) {
    return this.favoritesService.getFavorites(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a business to favorites' })
  async addFavorite(@CurrentUser() user: User, @Body() dto: AddFavoriteDto) {
    return this.favoritesService.addFavorite(user.id, dto.businessId);
  }

  @Delete(':businessId')
  @ApiOperation({ summary: 'Remove a business from favorites' })
  async removeFavorite(
    @CurrentUser() user: User,
    @Param('businessId') businessId: string,
  ) {
    await this.favoritesService.removeFavorite(user.id, businessId);
    return { success: true };
  }
}

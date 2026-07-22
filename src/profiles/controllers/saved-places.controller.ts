import { Controller, Get, Post, Delete, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { SavedPlacesService } from '../services/saved-places.service';

class AddSavedPlaceDto {
  @ApiProperty()
  label: string;
  
  @ApiProperty()
  address: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;
}

@ApiTags('Saved Places')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('saved-places')
export class SavedPlacesController {
  constructor(private readonly savedPlacesService: SavedPlacesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user saved places' })
  async getSavedPlaces(@CurrentUser() user: User) {
    return this.savedPlacesService.getSavedPlaces(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new saved place' })
  async addSavedPlace(@CurrentUser() user: User, @Body() dto: AddSavedPlaceDto) {
    return this.savedPlacesService.addSavedPlace(user.id, dto.label, dto.address, dto.latitude, dto.longitude);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a saved place' })
  async removeSavedPlace(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.savedPlacesService.removeSavedPlace(user.id, id);
    return { success: true };
  }
}

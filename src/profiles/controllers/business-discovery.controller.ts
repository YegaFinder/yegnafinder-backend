import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { BusinessResponseDto } from '../dto/business-response.dto';
import { ListingApprovalService } from '../services/listing-approval.service';

@ApiTags('Business Discovery')
@Controller('businesses')
export class BusinessDiscoveryController {
  constructor(
    private readonly listingApprovalService: ListingApprovalService,
  ) {}

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Keyword search approved public businesses' })
  @ApiQuery({ name: 'q', required: true, type: String })
  async search(@Query('q') q: string): Promise<{ businesses: BusinessResponseDto[] }> {
    const businesses = await this.listingApprovalService.searchPublic(q);
    return { businesses: businesses.map((b) => new BusinessResponseDto(b)) };
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby approved public businesses' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'radiusKm', required: true, type: Number })
  async nearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radiusKm') radiusKm: string,
  ): Promise<{ businesses: BusinessResponseDto[] }> {
    const lat = Number(latitude);
    const lon = Number(longitude);
    const radius = Number(radiusKm);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException('latitude and longitude must be numbers');
    }

    if (!Number.isFinite(radius) || radius <= 0) {
      throw new BadRequestException('radiusKm must be a positive number');
    }

    const businesses = await this.listingApprovalService.findNearby(
      lat,
      lon,
      radius,
    );

    return { businesses: businesses.map((b) => new BusinessResponseDto(b)) };
  }
}

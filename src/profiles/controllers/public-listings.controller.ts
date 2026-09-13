import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ListingApprovalService } from '../services/listing-approval.service';
import { BusinessResponseDto } from '../dto/business-response.dto';

@ApiTags('Public Listings')
@Controller('listings')
export class PublicListingsController {
  constructor(
    private readonly listingApprovalService: ListingApprovalService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List approved public business listings',
  })
  async list(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<{ listings: BusinessResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const { data: businesses, total } = await this.listingApprovalService.listPublic(pageNum, limitNum);
    return { 
      listings: businesses.map((b) => new BusinessResponseDto(b)),
      meta: { total, page: pageNum, limit: limitNum }
    };
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Keyword search approved public listings' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Query('q') q: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<{ listings: BusinessResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    if (!q || !q.trim()) {
      throw new BadRequestException('q must be a non-empty string');
    }

    const result = await this.listingApprovalService.searchPublicPaginated(
      q,
      page,
      limit,
    );

    return {
      listings: result.listings.map((b) => new BusinessResponseDto(b)),
      meta: result.meta,
    };
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby approved public listings' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius = '5',
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<{ listings: BusinessResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const latitude = Number(lat);
    const longitude = Number(lng);
    const radiusKm = Number(radius);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new BadRequestException('lat must be a valid latitude');
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new BadRequestException('lng must be a valid longitude');
    }

    if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
      throw new BadRequestException('radius must be a positive number');
    }

    const result = await this.listingApprovalService.findNearbyPaginated(
      latitude,
      longitude,
      radiusKm,
      page,
      limit,
    );

    return {
      listings: result.listings.map((b) => {
        const dto = new BusinessResponseDto(b);
        dto.distanceKm = b.distanceKm;
        return dto;
      }),
      meta: result.meta,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get an approved public business listing',
  })
  async findOne(@Param('id') id: string): Promise<BusinessResponseDto> {
    const business = await this.listingApprovalService.getPublicById(id);
    return new BusinessResponseDto(business);
  }
}

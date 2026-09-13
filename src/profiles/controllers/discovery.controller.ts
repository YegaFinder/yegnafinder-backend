import { Controller, Get, Param, Query, ValidationPipe, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { DiscoveryService } from '../services/discovery.service';
import { DiscoveryQueryDto, SearchQueryDto, NearbyQueryDto } from '../dto/discovery-query.dto';

@ApiTags('Discovery')
@Controller('businesses')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all businesses for discovery (search & nearby)' })
  @ApiResponse({ status: 200, description: 'Paginated list of businesses returned successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters.' })
  async findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: DiscoveryQueryDto,
  ) {
    const result = await this.discoveryService.findAll(query);
    return { data: result };
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search businesses by name or description' })
  @ApiResponse({ status: 200, description: 'Search results returned successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid search parameters.' })
  async search(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: SearchQueryDto,
  ) {
    const { q, page, limit } = query;
    const result = await this.discoveryService.search(q, page, limit);
    return { data: result };
  }

  @Get('nearby')
  @Public()
  @ApiOperation({ summary: 'Find nearby businesses within radius' })
  @ApiResponse({ status: 200, description: 'Nearby businesses returned successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid location parameters.' })
  async findNearby(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: NearbyQueryDto,
  ) {
    const { lat, lng, radius, page, limit } = query;
    const result = await this.discoveryService.findNearby(lat, lng, radius, page, limit);
    return { data: result };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get detailed view of a business' })
  @ApiResponse({ status: 200, description: 'Business details returned successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format.' })
  @ApiResponse({ status: 404, description: 'Business not found.' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4', errorHttpStatusCode: 400 })) id: string) {
    const business = await this.discoveryService.findOne(id);
    return { data: business };
  }
}

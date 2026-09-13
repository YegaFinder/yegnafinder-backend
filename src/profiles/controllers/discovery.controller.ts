import { Controller, Get, Param, Query, ValidationPipe, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DiscoveryService } from '../services/discovery.service';
import { DiscoveryQueryDto } from '../dto/discovery-query.dto';

@ApiTags('Discovery')
@Controller('businesses')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get()
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

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed view of a business' })
  @ApiResponse({ status: 200, description: 'Business details returned successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format.' })
  @ApiResponse({ status: 404, description: 'Business not found.' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4', errorHttpStatusCode: 400 })) id: string) {
    const business = await this.discoveryService.findOne(id);
    return { data: business };
  }
}

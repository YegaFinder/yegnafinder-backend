import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  async list(): Promise<{ listings: BusinessResponseDto[] }> {
    const businesses = await this.listingApprovalService.listPublic();
    return { listings: businesses.map((b) => new BusinessResponseDto(b)) };
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

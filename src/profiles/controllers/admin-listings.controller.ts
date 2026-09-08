import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { ListingApprovalService } from '../services/listing-approval.service';
import { BusinessResponseDto } from '../dto/business-response.dto';
import { RejectListingDto } from '../dto/listing-approval.dto';
import { ListingStatus } from '../enums/listing-status.enum';

@ApiTags('Admin Listings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Controller('admin/listings')
export class AdminListingsController {
  constructor(
    private readonly listingApprovalService: ListingApprovalService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List business listings for ops review (filter by status)',
  })
  @ApiQuery({ name: 'status', required: false, enum: ListingStatus })
  async list(
    @Query('status', new ParseEnumPipe(ListingStatus, { optional: true }))
    status?: ListingStatus,
  ): Promise<{ listings: BusinessResponseDto[] }> {
    const businesses = await this.listingApprovalService.listForOps(status);
    return { listings: businesses.map((b) => new BusinessResponseDto(b)) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a listing by id (any approval status)' })
  async findOne(@Param('id') id: string): Promise<BusinessResponseDto> {
    const business = await this.listingApprovalService.getById(id);
    return new BusinessResponseDto(business);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a listing so it becomes public' })
  async approve(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<BusinessResponseDto> {
    const business = await this.listingApprovalService.approve(id, user.id);
    return new BusinessResponseDto(business);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a listing and keep it off the public catalog' })
  async reject(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: RejectListingDto,
  ): Promise<BusinessResponseDto> {
    const business = await this.listingApprovalService.reject(
      id,
      user.id,
      dto.reason,
    );
    return new BusinessResponseDto(business);
  }
}

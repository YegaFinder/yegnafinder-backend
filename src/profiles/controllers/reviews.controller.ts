import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { ReviewsService } from '../services/reviews.service';
import { CreateReviewDto } from '../dto/create-review.dto';

@ApiTags('Reviews')
@Controller('businesses/:businessId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a review for a business' })
  async createReview(
    @Param('businessId') businessId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(businessId, user.id, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all reviews for a business' })
  async getReviews(@Param('businessId') businessId: string) {
    return this.reviewsService.getBusinessReviews(businessId);
  }
}

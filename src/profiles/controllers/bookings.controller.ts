import { Controller, Post, Get, Patch, Body, Param, UseGuards, ParseUUIDPipe, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { BookingsService } from '../services/bookings.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { BookingStatus } from '../entities/booking.entity';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Business not found.' })
  async createBooking(
    @CurrentUser() user: User,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(user.id, dto);
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get all bookings for the current customer' })
  async getMyBookings(@CurrentUser() user: User) {
    return this.bookingsService.getCustomerBookings(user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking as a customer' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID or booking cannot be cancelled.' })
  @ApiResponse({ status: 403, description: 'Forbidden – not your booking.' })
  async cancelBooking(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe({ version: '4', errorHttpStatusCode: 400 })) bookingId: string,
  ) {
    return this.bookingsService.cancelBooking(user.id, bookingId);
  }

  @Get('merchant')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get all incoming bookings for a merchant' })
  async getMerchantBookings(@CurrentUser() user: User) {
    return this.bookingsService.getMerchantBookings(user.id);
  }

  @Patch('merchant/:id/accept')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Accept a booking as a merchant' })
  @ApiResponse({ status: 200, description: 'Booking accepted.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID.' })
  @ApiResponse({ status: 403, description: 'Forbidden – not your booking.' })
  async acceptBooking(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe({ version: '4', errorHttpStatusCode: 400 })) bookingId: string,
  ) {
    return this.bookingsService.updateBookingStatus(user.id, bookingId, BookingStatus.ACCEPTED);
  }

  @Patch('merchant/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Reject a booking as a merchant' })
  @ApiResponse({ status: 200, description: 'Booking rejected.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID.' })
  @ApiResponse({ status: 403, description: 'Forbidden – not your booking.' })
  async rejectBooking(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe({ version: '4', errorHttpStatusCode: 400 })) bookingId: string,
  ) {
    return this.bookingsService.updateBookingStatus(user.id, bookingId, BookingStatus.REJECTED);
  }
}

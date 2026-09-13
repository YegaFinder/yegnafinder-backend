import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { Business } from '../entities/business.entity';
import { CreateBookingDto } from '../dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async createBooking(customerId: string, dto: CreateBookingDto): Promise<Booking> {
    const business = await this.businessRepository.findOne({ where: { id: dto.businessId } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const appointmentTime = new Date(dto.appointmentTime);
    if (appointmentTime < new Date()) {
      throw new BadRequestException('Appointment time must be in the future');
    }

    const booking = this.bookingRepository.create({
      customerId,
      businessId: dto.businessId,
      appointmentTime,
      notes: dto.notes,
      status: BookingStatus.PENDING,
    });

    return this.bookingRepository.save(booking);
  }

  async getCustomerBookings(customerId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { customerId },
      order: { appointmentTime: 'DESC' },
      relations: ['business'],
    });
  }

  async getMerchantBookings(merchantUserId: string): Promise<Booking[]> {
    // Find business owned by merchant
    const business = await this.businessRepository.findOne({ where: { userId: merchantUserId } });
    if (!business) {
      throw new NotFoundException('No business found for this merchant');
    }

    return this.bookingRepository.find({
      where: { businessId: business.id },
      order: { appointmentTime: 'DESC' },
      relations: ['customer'],
    });
  }

  async updateBookingStatus(merchantUserId: string, bookingId: string, status: BookingStatus): Promise<Booking> {
    const business = await this.businessRepository.findOne({ where: { userId: merchantUserId } });
    if (!business) {
      throw new NotFoundException('No business found for this merchant');
    }

    const booking = await this.bookingRepository.findOne({ where: { id: bookingId, businessId: business.id } });
    if (!booking) {
      throw new NotFoundException('Booking not found or does not belong to your business');
    }

    booking.status = status;
    return this.bookingRepository.save(booking);
  }

  async cancelBooking(customerId: string, bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId, customerId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be cancelled by the customer');
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepository.save(booking);
  }
}

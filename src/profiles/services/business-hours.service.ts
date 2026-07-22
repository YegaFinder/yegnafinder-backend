import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessHours, DayOfWeek } from '../entities/business-hours.entity';
import { Business } from '../entities/business.entity';
import { BusinessHoursDto } from '../dto/business-hours.dto';

@Injectable()
export class BusinessHoursService {
  constructor(
    @InjectRepository(BusinessHours)
    private businessHoursRepository: Repository<BusinessHours>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
  ) {}

  async updateBusinessHours(
    businessId: string,
    hoursData: BusinessHoursDto[],
  ): Promise<BusinessHours[]> {
    // Verify business exists
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Validate business hours data
    this.validateBusinessHours(hoursData);

    // Delete existing business hours
    await this.businessHoursRepository.delete({ businessId });

    // Create new business hours
    const businessHours = hoursData.map((hours) => {
      return this.businessHoursRepository.create({
        businessId,
        ...hours,
      });
    });

    return this.businessHoursRepository.save(businessHours);
  }

  async getBusinessHours(businessId: string): Promise<BusinessHours[]> {
    return this.businessHoursRepository.find({
      where: { businessId },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async isOpenNow(businessId: string): Promise<boolean> {
    const now = new Date();
    const dayOfWeek = this.getCurrentDayOfWeek(now);
    const currentTime = this.formatTime(now);

    const todayHours = await this.businessHoursRepository.findOne({
      where: { businessId, dayOfWeek },
    });

    if (!todayHours || todayHours.isClosed) {
      return false;
    }

    if (todayHours.is24Hours) {
      return true;
    }

    if (!todayHours.openTime || !todayHours.closeTime) {
      return false;
    }

    // Check if current time is within business hours
    const isWithinHours =
      currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;

    // Check if not during break time (if break is defined)
    if (todayHours.breakStartTime && todayHours.breakEndTime) {
      const isDuringBreak =
        currentTime >= todayHours.breakStartTime &&
        currentTime <= todayHours.breakEndTime;
      return isWithinHours && !isDuringBreak;
    }

    return isWithinHours;
  }

  private validateBusinessHours(hoursData: BusinessHoursDto[]): void {
    // Ensure all days of the week are provided
    const providedDays = hoursData.map((h) => h.dayOfWeek);
    const allDays = Object.values(DayOfWeek);

    for (const day of allDays) {
      if (!providedDays.includes(day)) {
        throw new BadRequestException(
          `Business hours for ${day} must be provided`,
        );
      }
    }

    // Validate each day's hours
    for (const hours of hoursData) {
      if (hours.isClosed) {
        // If closed, openTime and closeTime should be null
        continue;
      }

      if (hours.is24Hours) {
        // If 24 hours, openTime and closeTime should be null
        continue;
      }

      // If not closed and not 24 hours, openTime and closeTime are required
      if (!hours.openTime || !hours.closeTime) {
        throw new BadRequestException(
          `Open and close times are required for ${hours.dayOfWeek}`,
        );
      }

      // Validate that close time is after open time
      if (hours.openTime >= hours.closeTime) {
        throw new BadRequestException(
          `Close time must be after open time for ${hours.dayOfWeek}`,
        );
      }

      // Validate break times if provided
      if (hours.breakStartTime || hours.breakEndTime) {
        if (!hours.breakStartTime || !hours.breakEndTime) {
          throw new BadRequestException(
            `Both break start and end times must be provided for ${hours.dayOfWeek}`,
          );
        }

        if (hours.breakStartTime >= hours.breakEndTime) {
          throw new BadRequestException(
            `Break end time must be after break start time for ${hours.dayOfWeek}`,
          );
        }

        // Break must be within business hours
        if (
          hours.breakStartTime < hours.openTime ||
          hours.breakEndTime > hours.closeTime
        ) {
          throw new BadRequestException(
            `Break time must be within business hours for ${hours.dayOfWeek}`,
          );
        }
      }
    }
  }

  private getCurrentDayOfWeek(date: Date): DayOfWeek {
    const days = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[date.getDay()];
  }

  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5); // HH:MM format
  }
}

import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Business } from './business.entity';

export enum DayOfWeek {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
  SUNDAY = 'Sunday',
}

@Entity('business_hours')
export class BusinessHours extends BaseEntity {
  @ManyToOne(() => Business, (business) => business.businessHours, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({
    name: 'day_of_week',
    type: 'enum',
    enum: DayOfWeek,
  })
  dayOfWeek: DayOfWeek;

  @Column({ name: 'open_time', type: 'time', nullable: true })
  openTime?: string; // Format: "08:00"

  @Column({ name: 'close_time', type: 'time', nullable: true })
  closeTime?: string; // Format: "17:00"

  @Column({ name: 'is_closed', type: 'boolean', default: false })
  isClosed: boolean;

  @Column({ name: 'is_24_hours', type: 'boolean', default: false })
  is24Hours: boolean;

  @Column({ name: 'break_start_time', type: 'time', nullable: true })
  breakStartTime?: string; // Optional lunch break

  @Column({ name: 'break_end_time', type: 'time', nullable: true })
  breakEndTime?: string;
}

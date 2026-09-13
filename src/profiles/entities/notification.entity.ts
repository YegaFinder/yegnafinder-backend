import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ name: 'business_id', type: 'uuid', nullable: true })
  businessId?: string;

  @Column({ type: 'varchar', length: 100, default: 'booking_confirmation' })
  type: string;

  @Column({ type: 'varchar', length: 50, default: 'email' })
  channel: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({
    name: 'delivery_status',
    type: 'varchar',
    length: 50,
    default: 'queued',
  })
  deliveryStatus?: string;
}

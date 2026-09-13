import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'gateway', type: 'varchar', length: 50, default: 'mock' })
  gateway: string;

  @Column({ name: 'gateway_transaction_id', type: 'varchar', length: 255, nullable: true })
  gatewayTransactionId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 8, default: 'ETB' })
  currency: string;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'PENDING' })
  status: string;

  @Column({ name: 'checkout_url', type: 'varchar', length: 500, nullable: true })
  checkoutUrl?: string;

  @Column({ name: 'return_url', type: 'varchar', length: 500, nullable: true })
  returnUrl?: string;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ name: 'refund_status', type: 'varchar', length: 50, nullable: true })
  refundStatus?: string;

  @Column({ name: 'refund_reference', type: 'varchar', length: 255, nullable: true })
  refundReference?: string;
}

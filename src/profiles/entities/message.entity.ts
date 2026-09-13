import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('messages')
export class Message extends BaseEntity {
  @Column({ name: 'conversation_id', type: 'varchar', length: 255 })
  conversationId: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({
    name: 'sender_role',
    type: 'varchar',
    length: 20,
    default: 'customer',
  })
  senderRole: 'customer' | 'business' | 'system';

  @Column({ type: 'text' })
  text: string;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date;
}

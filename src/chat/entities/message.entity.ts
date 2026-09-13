import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('chat_messages')
export class ChatMessage extends BaseEntity {
  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({
    name: 'sender_role',
    type: 'varchar',
    length: 20,
  })
  senderRole: 'CUSTOMER' | 'MERCHANT';

  @Column({ type: 'text' })
  text: string;
}
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  stubData?: string;
}

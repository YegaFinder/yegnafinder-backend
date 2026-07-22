import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('merchant_subscriptions')
export class MerchantSubscription extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  stubData?: string;
}

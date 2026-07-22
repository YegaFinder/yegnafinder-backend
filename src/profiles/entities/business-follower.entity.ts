import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('business_followers')
export class BusinessFollower extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  stubData?: string;
}

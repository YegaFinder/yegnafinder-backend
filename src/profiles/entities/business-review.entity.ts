import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('business_reviews')
export class BusinessReview extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  stubData?: string;
}

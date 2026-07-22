import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('recent_views')
export class RecentView extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  stubData?: string;
}

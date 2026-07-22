import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('recent_searches')
export class RecentSearch extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  stubData?: string;
}

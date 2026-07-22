import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('languages')
export class Language extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  stubData?: string;
}

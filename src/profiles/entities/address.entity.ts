import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('addresses')
export class Address extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  stubData?: string;
}

import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Business } from './business.entity';

@Entity('business_categories')
export class BusinessCategory extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Business, (business) => business.businessCategories)
  businesses: Business[];
}

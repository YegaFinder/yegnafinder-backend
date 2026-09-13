import { Column, Entity, ManyToMany, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Business } from './business.entity';

@Entity('business_categories')
export class BusinessCategory extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => BusinessCategory, (category) => category.subCategories, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parentCategory?: BusinessCategory | null;

  @OneToMany(() => BusinessCategory, (category) => category.parentCategory)
  subCategories: BusinessCategory[];

  @ManyToMany(() => Business, (business) => business.businessCategories)
  businesses: Business[];
}


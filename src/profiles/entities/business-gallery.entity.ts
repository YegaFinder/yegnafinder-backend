import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Business } from './business.entity';

@Entity('business_gallery')
export class BusinessGallery extends BaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ name: 'media_url', type: 'varchar', length: 500 })
  mediaUrl: string;

  @Column({ name: 'media_type', type: 'varchar', length: 20, default: 'image' })
  mediaType: string;

  @Column({ type: 'text', nullable: true })
  caption?: string;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;
}

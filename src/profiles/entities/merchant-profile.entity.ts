import { Column, Entity, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('merchant_profiles')
export class MerchantProfile extends BaseEntity {
  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'business_name', type: 'varchar', length: 200 })
  businessName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl?: string;

  @Column({ name: 'banner_url', type: 'varchar', length: 500, nullable: true })
  bannerUrl?: string;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail?: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 20, nullable: true })
  contactPhone?: string;

  @Column({ name: 'business_address', type: 'text', nullable: true })
  businessAddress?: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column({ name: 'website_url', type: 'varchar', length: 500, nullable: true })
  websiteUrl?: string;

  @Column({ name: 'social_media', type: 'jsonb', default: {} })
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };

  @Column({ name: 'business_categories', type: 'jsonb', default: [] })
  businessCategories: string[];

  @Column({ name: 'services_offered', type: 'jsonb', default: [] })
  servicesOffered: Array<{
    id: string;
    name: string;
    description?: string;
    price?: number;
    currency?: string;
  }>;

  // Note: BusinessHours will be added by Developer 2
  // @OneToMany(() => BusinessHours, (hours) => hours.merchantProfile, { cascade: true })
  // businessHours: BusinessHours[];

  @Column({ name: 'verification_status', type: 'varchar', default: 'pending' })
  verificationStatus: 'pending' | 'verified' | 'rejected';

  @Column({ name: 'verification_documents', type: 'jsonb', default: [] })
  verificationDocuments: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ name: 'total_reviews', type: 'integer', default: 0 })
  totalReviews: number;

  @Column({ name: 'is_profile_complete', type: 'boolean', default: false })
  isProfileComplete: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;
}
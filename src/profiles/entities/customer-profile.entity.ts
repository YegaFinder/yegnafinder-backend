import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('customer_profiles')
export class CustomerProfile extends BaseEntity {
  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({
    name: 'preferred_language',
    type: 'varchar',
    length: 10,
    default: 'en',
  })
  preferredLanguage: string;

  @Column({ name: 'notification_preferences', type: 'jsonb', default: {} })
  notificationPreferences: Record<string, boolean>;

  @Column({ name: 'saved_addresses', type: 'jsonb', default: [] })
  savedAddresses: Array<{
    id: string;
    label: string;
    address: string;
    latitude: number;
    longitude: number;
  }>;

  @Column({ name: 'loyalty_points', type: 'integer', default: 0 })
  loyaltyPoints: number;

  @Column({ name: 'is_profile_complete', type: 'boolean', default: false })
  isProfileComplete: boolean;
}

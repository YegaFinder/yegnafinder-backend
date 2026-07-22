import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Business } from './business.entity';

@Entity('business_documents')
export class BusinessDocument extends BaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ name: 'document_type', type: 'varchar', length: 100 })
  documentType: string; // e.g., 'license', 'tax_id'

  @Column({ name: 'document_url', type: 'varchar', length: 500 })
  documentUrl: string;

  @Column({ name: 'verification_status', type: 'varchar', default: 'pending' })
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

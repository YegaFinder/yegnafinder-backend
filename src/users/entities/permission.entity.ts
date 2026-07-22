import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 100, unique: true })
  name: string; // e.g., 'CREATE_BUSINESS', 'UPDATE_PROFILE'

  @Column({ type: 'text', nullable: true })
  description?: string;
}

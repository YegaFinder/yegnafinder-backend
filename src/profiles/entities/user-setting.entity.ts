import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('user_settings')
export class UserSetting extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  stubData?: string;
}

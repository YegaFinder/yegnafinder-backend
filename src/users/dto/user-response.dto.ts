import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Lidia' })
  firstName: string;

  @ApiProperty({ example: 'Tech' })
  lastName: string;

  @ApiProperty({ example: 'lidia@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '+251911234567' })
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  role: UserRole;

  @ApiProperty({ example: true })
  isEmailVerified: boolean;

  @ApiProperty({ example: false })
  isPhoneVerified: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-07-06T12:00:00.000Z' })
  createdAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.phone = user.phone;
    this.role = user.role;
    this.isEmailVerified = user.isEmailVerified;
    this.isPhoneVerified = user.isPhoneVerified;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
  }
}

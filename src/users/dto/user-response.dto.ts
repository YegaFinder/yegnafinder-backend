import { UserRole } from '../enums/user-role.enum';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
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

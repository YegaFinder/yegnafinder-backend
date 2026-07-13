import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class CustomerProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user: UserResponseDto;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  bio?: string;

  @ApiProperty()
  preferredLanguage: string;

  @ApiProperty()
  notificationPreferences: Record<string, boolean>;

  @ApiProperty()
  savedAddresses: Array<any>;

  @ApiProperty()
  loyaltyPoints: number;

  @ApiProperty()
  isProfileComplete: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(profile: CustomerProfile) {
    this.id = profile.id;
    this.user = new UserResponseDto(profile.user);
    this.avatarUrl = profile.avatarUrl;
    this.dateOfBirth = profile.dateOfBirth;
    this.bio = profile.bio;
    this.preferredLanguage = profile.preferredLanguage;
    this.notificationPreferences = profile.notificationPreferences;
    this.savedAddresses = profile.savedAddresses;
    this.loyaltyPoints = profile.loyaltyPoints;
    this.isProfileComplete = profile.isProfileComplete;
    this.createdAt = profile.createdAt;
    this.updatedAt = profile.updatedAt;
  }
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MerchantProfile } from '../entities/merchant-profile.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class MerchantProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user: UserResponseDto;

  @ApiProperty()
  businessName: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  logoUrl?: string;

  @ApiPropertyOptional()
  bannerUrl?: string;

  @ApiPropertyOptional()
  contactEmail?: string;

  @ApiPropertyOptional()
  contactPhone?: string;

  @ApiPropertyOptional()
  businessAddress?: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;

  @ApiPropertyOptional()
  websiteUrl?: string;

  @ApiProperty()
  socialMedia: Record<string, string>;

  @ApiProperty()
  businessCategories: string[];

  @ApiProperty()
  servicesOffered: Array<any>;

  @ApiProperty()
  businessHours: Array<any>;

  @ApiProperty()
  verificationStatus: string;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  isProfileComplete: boolean;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(profile: MerchantProfile) {
    this.id = profile.id;
    this.user = new UserResponseDto(profile.user);
    this.businessName = profile.businessName;
    this.description = profile.description;
    this.logoUrl = profile.logoUrl;
    this.bannerUrl = profile.bannerUrl;
    this.contactEmail = profile.contactEmail;
    this.contactPhone = profile.contactPhone;
    this.businessAddress = profile.businessAddress;
    this.latitude = profile.latitude;
    this.longitude = profile.longitude;
    this.websiteUrl = profile.websiteUrl;
    this.socialMedia = profile.socialMedia;
    this.businessCategories = profile.businessCategories;
    this.servicesOffered = profile.servicesOffered;
    this.businessHours = []; // Will be populated by Developer 2's business hours system
    this.verificationStatus = profile.verificationStatus;
    this.averageRating = profile.averageRating;
    this.totalReviews = profile.totalReviews;
    this.isProfileComplete = profile.isProfileComplete;
    this.isFeatured = profile.isFeatured;
    this.createdAt = profile.createdAt;
    this.updatedAt = profile.updatedAt;
  }
}
# Sprint 2 Implementation Plan: Profiles & Infrastructure

**YegnaFinder V2 Backend Development**

## Overview

Sprint 2 focuses on implementing comprehensive user profiles, file upload infrastructure, and enhanced authentication for the YegnaFinder V2 platform. This sprint will deliver the backend contracts needed by the frontend team for customer and merchant profile management.

## Team Distribution

### Developer 1: Profile System & Authentication
- **Task 1**: Profile Entities & DTOs
- **Task 4**: Authentication Enhancements  
- **Task 5**: Profile API Endpoints

### Developer 2: Infrastructure & Business Logic
- **Task 2**: Presigned Upload System
- **Task 3**: Business Hours Management
- **Task 6**: Validation & Testing

## Frontend Requirements Analysis

Based on the frontend team's questions, we need to implement:

1. **Profile Schema**: Customer and Merchant profile fields
2. **Presigned Upload**: Direct-to-S3 upload for performance
3. **Business Hours**: Flexible schedule management
4. **Role in Auth**: User role in login responses and JWT claims
## Developer 1 Tasks

### Task 1: Create Profile Entities & DTOs

**Objective**: Create comprehensive CustomerProfile and MerchantProfile entities with validation

#### 1.1 Create CustomerProfile Entity

Create `src/profiles/entities/customer-profile.entity.ts`:

```typescript
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

  @Column({ name: 'preferred_language', type: 'varchar', length: 10, default: 'en' })
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
```
#### 1.2 Create MerchantProfile Entity

Create `src/profiles/entities/merchant-profile.entity.ts`:

```typescript
import { Column, Entity, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { BusinessHours } from './business-hours.entity';

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

  @OneToMany(() => BusinessHours, (hours) => hours.merchantProfile, { cascade: true })
  businessHours: BusinessHours[];

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
```
#### 1.3 Create Profile DTOs

Create `src/profiles/dto/create-customer-profile.dto.ts`:

```typescript
import { IsOptional, IsString, IsDateString, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerProfileDto {
  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Coffee enthusiast and food lover' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  notificationPreferences?: Record<string, boolean>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  savedAddresses?: Array<{
    id: string;
    label: string;
    address: string;
    latitude: number;
    longitude: number;
  }>;
}

export class UpdateCustomerProfileDto extends CreateCustomerProfileDto {}
```

Create `src/profiles/dto/create-merchant-profile.dto.ts`:

```typescript
import { IsString, IsOptional, IsEmail, IsNumber, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMerchantProfileDto {
  @ApiProperty({ example: 'Bella Coffee House' })
  @IsString()
  businessName: string;

  @ApiPropertyOptional({ example: 'Premium coffee and pastries in the heart of Addis' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.jpg' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.jpg' })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'contact@bellacoffee.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+251911234567' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Bole Road, Addis Ababa, Ethiopia' })
  @IsOptional()
  @IsString()
  businessAddress?: string;

  @ApiPropertyOptional({ example: 9.0054 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 38.7636 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'https://bellacoffee.com' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  businessCategories?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  servicesOffered?: Array<{
    id: string;
    name: string;
    description?: string;
    price?: number;
    currency?: string;
  }>;
}

export class UpdateMerchantProfileDto extends CreateMerchantProfileDto {}
```
#### 1.4 Create Response DTOs

Create `src/profiles/dto/customer-profile-response.dto.ts`:

```typescript
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
```

Create `src/profiles/dto/merchant-profile-response.dto.ts`:

```typescript
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
    this.businessHours = profile.businessHours || [];
    this.verificationStatus = profile.verificationStatus;
    this.averageRating = profile.averageRating;
    this.totalReviews = profile.totalReviews;
    this.isProfileComplete = profile.isProfileComplete;
    this.isFeatured = profile.isFeatured;
    this.createdAt = profile.createdAt;
    this.updatedAt = profile.updatedAt;
  }
}
```
### Task 4: Enhance Authentication with Role Information

**Objective**: Update authentication responses to include user role for frontend routing

#### 4.1 Update AuthResponseDto

Modify `src/auth/dto/auth-response.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: UserResponseDto;

  @ApiProperty({ description: 'User role for frontend routing' })
  role: string;

  constructor(data: { accessToken: string; refreshToken: string; user: UserResponseDto }) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.user = data.user;
    this.role = data.user.role; // Extract role from user for easy access
  }
}
```

#### 4.2 Update UserResponseDto

Modify `src/users/dto/user-response.dto.ts` to ensure role is included:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isEmailVerified: boolean;

  @ApiProperty()
  isPhoneVerified: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

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
    this.lastLoginAt = user.lastLoginAt;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
```

#### 4.3 Update JWT Payload Interface

Create `src/auth/interfaces/jwt-payload.interface.ts`:

```typescript
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
```

#### 4.4 Update TokenService

Ensure JWT includes role in claims (already implemented, but verify):

```typescript
// In src/auth/services/token.service.ts
async generateAccessToken(user: User): Promise<string> {
  const payload: JwtPayload = { 
    sub: user.id, 
    email: user.email, 
    role: user.role 
  };
  return this.jwtService.signAsync(payload, {
    secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    expiresIn: this.configService.getOrThrow<string>('JWT_EXPIRES_IN') as StringValue,
  });
}
```
### Task 5: Create Profile Management API Endpoints

**Objective**: Build complete CRUD API for customer and merchant profiles

#### 5.1 Create Profiles Module

Create `src/profiles/profiles.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerProfile } from './entities/customer-profile.entity';
import { MerchantProfile } from './entities/merchant-profile.entity';
import { BusinessHours } from './entities/business-hours.entity';
import { ProfilesService } from './services/profiles.service';
import { CustomerProfilesController } from './controllers/customer-profiles.controller';
import { MerchantProfilesController } from './controllers/merchant-profiles.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerProfile, MerchantProfile, BusinessHours]),
    UsersModule,
  ],
  providers: [ProfilesService],
  controllers: [CustomerProfilesController, MerchantProfilesController],
  exports: [ProfilesService, TypeOrmModule],
})
export class ProfilesModule {}
```

#### 5.2 Create ProfilesService

Create `src/profiles/services/profiles.service.ts`:

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { MerchantProfile } from '../entities/merchant-profile.entity';
import { CreateCustomerProfileDto, UpdateCustomerProfileDto } from '../dto/create-customer-profile.dto';
import { CreateMerchantProfileDto, UpdateMerchantProfileDto } from '../dto/create-merchant-profile.dto';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(CustomerProfile)
    private customerProfileRepository: Repository<CustomerProfile>,
    @InjectRepository(MerchantProfile)
    private merchantProfileRepository: Repository<MerchantProfile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Customer Profile Methods
  async createCustomerProfile(userId: string, dto: CreateCustomerProfileDto): Promise<CustomerProfile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.CUSTOMER) throw new ConflictException('User is not a customer');

    const existingProfile = await this.customerProfileRepository.findOne({ where: { userId } });
    if (existingProfile) throw new ConflictException('Customer profile already exists');

    const profile = this.customerProfileRepository.create({
      userId,
      ...dto,
      isProfileComplete: this.checkCustomerProfileCompletion(dto),
    });

    return this.customerProfileRepository.save(profile);
  }

  async getCustomerProfile(userId: string): Promise<CustomerProfile> {
    const profile = await this.customerProfileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Customer profile not found');
    return profile;
  }

  async updateCustomerProfile(userId: string, dto: UpdateCustomerProfileDto): Promise<CustomerProfile> {
    const profile = await this.getCustomerProfile(userId);
    Object.assign(profile, dto);
    profile.isProfileComplete = this.checkCustomerProfileCompletion(profile);
    return this.customerProfileRepository.save(profile);
  }

  // Merchant Profile Methods
  async createMerchantProfile(userId: string, dto: CreateMerchantProfileDto): Promise<MerchantProfile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.MERCHANT) throw new ConflictException('User is not a merchant');

    const existingProfile = await this.merchantProfileRepository.findOne({ where: { userId } });
    if (existingProfile) throw new ConflictException('Merchant profile already exists');

    const profile = this.merchantProfileRepository.create({
      userId,
      ...dto,
      isProfileComplete: this.checkMerchantProfileCompletion(dto),
    });

    return this.merchantProfileRepository.save(profile);
  }

  async getMerchantProfile(userId: string): Promise<MerchantProfile> {
    const profile = await this.merchantProfileRepository.findOne({
      where: { userId },
      relations: ['user', 'businessHours'],
    });
    if (!profile) throw new NotFoundException('Merchant profile not found');
    return profile;
  }

  async updateMerchantProfile(userId: string, dto: UpdateMerchantProfileDto): Promise<MerchantProfile> {
    const profile = await this.getMerchantProfile(userId);
    Object.assign(profile, dto);
    profile.isProfileComplete = this.checkMerchantProfileCompletion(profile);
    return this.merchantProfileRepository.save(profile);
  }

  // Helper Methods
  private checkCustomerProfileCompletion(profile: Partial<CustomerProfile>): boolean {
    return !!(profile.avatarUrl && profile.bio && profile.preferredLanguage);
  }

  private checkMerchantProfileCompletion(profile: Partial<MerchantProfile>): boolean {
    return !!(
      profile.businessName &&
      profile.description &&
      profile.logoUrl &&
      profile.businessAddress &&
      profile.contactPhone
    );
  }
}
```
#### 5.3 Create Customer Profiles Controller

Create `src/profiles/controllers/customer-profiles.controller.ts`:

```typescript
import { Controller, Get, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ProfilesService } from '../services/profiles.service';
import { CreateCustomerProfileDto, UpdateCustomerProfileDto } from '../dto/create-customer-profile.dto';
import { CustomerProfileResponseDto } from '../dto/customer-profile-response.dto';

@ApiTags('Customer Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Controller('profiles/customer')
export class CustomerProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create customer profile' })
  async create(
    @Request() req,
    @Body() createProfileDto: CreateCustomerProfileDto,
  ): Promise<CustomerProfileResponseDto> {
    const profile = await this.profilesService.createCustomerProfile(req.user.sub, createProfileDto);
    return new CustomerProfileResponseDto(profile);
  }

  @Get()
  @ApiOperation({ summary: 'Get customer profile' })
  async findOne(@Request() req): Promise<CustomerProfileResponseDto> {
    const profile = await this.profilesService.getCustomerProfile(req.user.sub);
    return new CustomerProfileResponseDto(profile);
  }

  @Put()
  @ApiOperation({ summary: 'Update customer profile' })
  async update(
    @Request() req,
    @Body() updateProfileDto: UpdateCustomerProfileDto,
  ): Promise<CustomerProfileResponseDto> {
    const profile = await this.profilesService.updateCustomerProfile(req.user.sub, updateProfileDto);
    return new CustomerProfileResponseDto(profile);
  }
}
```

#### 5.4 Create Merchant Profiles Controller

Create `src/profiles/controllers/merchant-profiles.controller.ts`:

```typescript
import { Controller, Get, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ProfilesService } from '../services/profiles.service';
import { CreateMerchantProfileDto, UpdateMerchantProfileDto } from '../dto/create-merchant-profile.dto';
import { MerchantProfileResponseDto } from '../dto/merchant-profile-response.dto';

@ApiTags('Merchant Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MERCHANT)
@Controller('profiles/merchant')
export class MerchantProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create merchant profile' })
  async create(
    @Request() req,
    @Body() createProfileDto: CreateMerchantProfileDto,
  ): Promise<MerchantProfileResponseDto> {
    const profile = await this.profilesService.createMerchantProfile(req.user.sub, createProfileDto);
    return new MerchantProfileResponseDto(profile);
  }

  @Get()
  @ApiOperation({ summary: 'Get merchant profile' })
  async findOne(@Request() req): Promise<MerchantProfileResponseDto> {
    const profile = await this.profilesService.getMerchantProfile(req.user.sub);
    return new MerchantProfileResponseDto(profile);
  }

  @Put()
  @ApiOperation({ summary: 'Update merchant profile' })
  async update(
    @Request() req,
    @Body() updateProfileDto: UpdateMerchantProfileDto,
  ): Promise<MerchantProfileResponseDto> {
    const profile = await this.profilesService.updateMerchantProfile(req.user.sub, updateProfileDto);
    return new MerchantProfileResponseDto(profile);
  }
}
```
## Developer 2 Tasks

### Task 2: Implement Presigned URL Upload System with AWS S3

**Objective**: Create secure direct-to-S3 upload system for avatars, logos, and banners

#### 2.1 Add AWS S3 Configuration

Update `src/config/env.validation.ts`:

```typescript
// Add these new environment variables
@IsString()
@IsOptional()
AWS_REGION: string;

@IsString()
@IsOptional()
AWS_ACCESS_KEY_ID: string;

@IsString()
@IsOptional()
AWS_SECRET_ACCESS_KEY: string;

@IsString()
@IsOptional()
AWS_S3_BUCKET: string;

@IsString()
@IsOptional()
AWS_S3_CDN_URL: string;
```

Create `src/config/aws.config.ts`:

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3Bucket: process.env.AWS_S3_BUCKET,
  cdnUrl: process.env.AWS_S3_CDN_URL,
}));
```

#### 2.2 Install Required Packages

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner mime-types
npm install --save-dev @types/mime-types
```

#### 2.3 Create Upload Module

Create `src/uploads/uploads.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadsService } from './services/uploads.service';
import { UploadsController } from './controllers/uploads.controller';
import awsConfig from '../config/aws.config';

@Module({
  imports: [ConfigModule.forFeature(awsConfig)],
  providers: [UploadsService],
  controllers: [UploadsController],
  exports: [UploadsService],
})
export class UploadsModule {}
```

#### 2.4 Create Upload Service

Create `src/uploads/services/uploads.service.ts`:

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { lookup } from 'mime-types';
import { v4 as uuidv4 } from 'uuid';

export enum UploadType {
  AVATAR = 'avatar',
  LOGO = 'logo',
  BANNER = 'banner',
  DOCUMENT = 'document',
}

@Injectable()
export class UploadsService {
  private s3Client: S3Client;
  private bucket: string;
  private cdnUrl: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('aws.region'),
      credentials: {
        accessKeyId: this.configService.get('aws.accessKeyId'),
        secretAccessKey: this.configService.get('aws.secretAccessKey'),
      },
    });
    this.bucket = this.configService.get('aws.s3Bucket');
    this.cdnUrl = this.configService.get('aws.cdnUrl');
  }

  async generatePresignedUrl(
    filename: string,
    contentType: string,
    uploadType: UploadType,
    userId: string,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    // Validate content type
    const allowedTypes = this.getAllowedContentTypes(uploadType);
    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException(`Invalid content type for ${uploadType}. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Generate unique file key
    const fileExtension = this.getFileExtension(filename, contentType);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const key = `uploads/${uploadType}s/${userId}/${uniqueFilename}`;

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      Metadata: {
        userId,
        uploadType,
        originalFilename: filename,
      },
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
    const fileUrl = this.cdnUrl ? `${this.cdnUrl}/${key}` : `https://${this.bucket}.s3.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  private getAllowedContentTypes(uploadType: UploadType): string[] {
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const documentTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    switch (uploadType) {
      case UploadType.AVATAR:
      case UploadType.LOGO:
      case UploadType.BANNER:
        return imageTypes;
      case UploadType.DOCUMENT:
        return documentTypes;
      default:
        return imageTypes;
    }
  }

  private getFileExtension(filename: string, contentType: string): string {
    // Try to get extension from filename first
    const extensionMatch = filename.match(/\.[^.]+$/);
    if (extensionMatch) {
      return extensionMatch[0];
    }

    // Fallback to mime type
    const extension = lookup(contentType);
    return extension ? `.${extension.split('/')[1]}` : '.jpg';
  }

  async deleteFile(key: string): Promise<void> {
    // Implementation for deleting files (future enhancement)
    // This would use DeleteObjectCommand from AWS SDK
  }
}
```
#### 2.5 Create Upload DTOs

Create `src/uploads/dto/presigned-url.dto.ts`:

```typescript
import { IsString, IsEnum, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UploadType } from '../services/uploads.service';

export class PresignedUrlRequestDto {
  @ApiProperty({ example: 'profile-picture.jpg' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @Matches(/^(image\/(jpeg|png|webp)|application\/pdf)$/, {
    message: 'Content type must be image/jpeg, image/png, image/webp, or application/pdf',
  })
  contentType: string;

  @ApiProperty({ enum: UploadType, example: UploadType.AVATAR })
  @IsEnum(UploadType)
  uploadType: UploadType;
}

export class PresignedUrlResponseDto {
  @ApiProperty({ example: 'https://s3.amazonaws.com/bucket/presigned-url' })
  uploadUrl: string;

  @ApiProperty({ example: 'https://cdn.example.com/uploads/avatars/user123/file.jpg' })
  fileUrl: string;

  @ApiProperty({ example: 'uploads/avatars/user123/uuid-file.jpg' })
  key: string;
}
```

#### 2.6 Create Upload Controller

Create `src/uploads/controllers/uploads.controller.ts`:

```typescript
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UploadsService } from '../services/uploads.service';
import { PresignedUrlRequestDto, PresignedUrlResponseDto } from '../dto/presigned-url.dto';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Generate presigned URL for file upload' })
  @ApiResponse({ status: 201, type: PresignedUrlResponseDto })
  async generatePresignedUrl(
    @Request() req,
    @Body() dto: PresignedUrlRequestDto,
  ): Promise<PresignedUrlResponseDto> {
    const userId = req.user.sub;
    const result = await this.uploadsService.generatePresignedUrl(
      dto.filename,
      dto.contentType,
      dto.uploadType,
      userId,
    );

    return {
      uploadUrl: result.uploadUrl,
      fileUrl: result.fileUrl,
      key: result.key,
    };
  }
}
```

### Task 3: Build Business Hours Management System

**Objective**: Create flexible business hours system for merchant profiles

#### 3.1 Create Business Hours Entity

Create `src/profiles/entities/business-hours.entity.ts`:

```typescript
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { MerchantProfile } from './merchant-profile.entity';

export enum DayOfWeek {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
  SUNDAY = 'Sunday',
}

@Entity('business_hours')
export class BusinessHours extends BaseEntity {
  @ManyToOne(() => MerchantProfile, (profile) => profile.businessHours, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'merchant_profile_id' })
  merchantProfile: MerchantProfile;

  @Column({ name: 'merchant_profile_id', type: 'uuid' })
  merchantProfileId: string;

  @Column({
    name: 'day_of_week',
    type: 'enum',
    enum: DayOfWeek,
  })
  dayOfWeek: DayOfWeek;

  @Column({ name: 'open_time', type: 'time', nullable: true })
  openTime?: string; // Format: "08:00"

  @Column({ name: 'close_time', type: 'time', nullable: true })
  closeTime?: string; // Format: "17:00"

  @Column({ name: 'is_closed', type: 'boolean', default: false })
  isClosed: boolean;

  @Column({ name: 'is_24_hours', type: 'boolean', default: false })
  is24Hours: boolean;

  @Column({ name: 'break_start_time', type: 'time', nullable: true })
  breakStartTime?: string; // Optional lunch break

  @Column({ name: 'break_end_time', type: 'time', nullable: true })
  breakEndTime?: string;
}
```
#### 3.2 Create Business Hours DTOs

Create `src/profiles/dto/business-hours.dto.ts`:

```typescript
import { IsEnum, IsString, IsBoolean, IsOptional, Matches, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '../entities/business-hours.entity';

export class BusinessHoursDto {
  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiPropertyOptional({ example: '08:00', description: 'Opening time in HH:MM format' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openTime must be in HH:MM format (24-hour)',
  })
  @ValidateIf((o) => !o.isClosed && !o.is24Hours)
  openTime?: string;

  @ApiPropertyOptional({ example: '17:00', description: 'Closing time in HH:MM format' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closeTime must be in HH:MM format (24-hour)',
  })
  @ValidateIf((o) => !o.isClosed && !o.is24Hours)
  closeTime?: string;

  @ApiPropertyOptional({ example: false, description: 'Is the business closed on this day' })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Is the business open 24 hours on this day' })
  @IsOptional()
  @IsBoolean()
  is24Hours?: boolean;

  @ApiPropertyOptional({ example: '12:00', description: 'Break start time in HH:MM format' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'breakStartTime must be in HH:MM format (24-hour)',
  })
  breakStartTime?: string;

  @ApiPropertyOptional({ example: '13:00', description: 'Break end time in HH:MM format' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'breakEndTime must be in HH:MM format (24-hour)',
  })
  breakEndTime?: string;
}

export class UpdateBusinessHoursDto {
  @ApiProperty({ type: [BusinessHoursDto] })
  businessHours: BusinessHoursDto[];
}
```

#### 3.3 Create Business Hours Service

Create `src/profiles/services/business-hours.service.ts`:

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessHours, DayOfWeek } from '../entities/business-hours.entity';
import { MerchantProfile } from '../entities/merchant-profile.entity';
import { BusinessHoursDto } from '../dto/business-hours.dto';

@Injectable()
export class BusinessHoursService {
  constructor(
    @InjectRepository(BusinessHours)
    private businessHoursRepository: Repository<BusinessHours>,
    @InjectRepository(MerchantProfile)
    private merchantProfileRepository: Repository<MerchantProfile>,
  ) {}

  async updateBusinessHours(merchantProfileId: string, hoursData: BusinessHoursDto[]): Promise<BusinessHours[]> {
    // Verify merchant profile exists
    const merchantProfile = await this.merchantProfileRepository.findOne({
      where: { id: merchantProfileId },
    });
    if (!merchantProfile) {
      throw new NotFoundException('Merchant profile not found');
    }

    // Validate business hours data
    this.validateBusinessHours(hoursData);

    // Delete existing business hours
    await this.businessHoursRepository.delete({ merchantProfileId });

    // Create new business hours
    const businessHours = hoursData.map((hours) => {
      return this.businessHoursRepository.create({
        merchantProfileId,
        ...hours,
      });
    });

    return this.businessHoursRepository.save(businessHours);
  }

  async getBusinessHours(merchantProfileId: string): Promise<BusinessHours[]> {
    return this.businessHoursRepository.find({
      where: { merchantProfileId },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async isOpenNow(merchantProfileId: string): Promise<boolean> {
    const now = new Date();
    const dayOfWeek = this.getCurrentDayOfWeek(now);
    const currentTime = this.formatTime(now);

    const todayHours = await this.businessHoursRepository.findOne({
      where: { merchantProfileId, dayOfWeek },
    });

    if (!todayHours || todayHours.isClosed) {
      return false;
    }

    if (todayHours.is24Hours) {
      return true;
    }

    if (!todayHours.openTime || !todayHours.closeTime) {
      return false;
    }

    // Check if current time is within business hours
    const isWithinHours = currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
    
    // Check if not during break time (if break is defined)
    if (todayHours.breakStartTime && todayHours.breakEndTime) {
      const isDuringBreak = currentTime >= todayHours.breakStartTime && currentTime <= todayHours.breakEndTime;
      return isWithinHours && !isDuringBreak;
    }

    return isWithinHours;
  }

  private validateBusinessHours(hoursData: BusinessHoursDto[]): void {
    // Ensure all days of the week are provided
    const providedDays = hoursData.map(h => h.dayOfWeek);
    const allDays = Object.values(DayOfWeek);
    
    for (const day of allDays) {
      if (!providedDays.includes(day)) {
        throw new BadRequestException(`Business hours for ${day} must be provided`);
      }
    }

    // Validate each day's hours
    for (const hours of hoursData) {
      if (hours.isClosed) {
        // If closed, openTime and closeTime should be null
        continue;
      }

      if (hours.is24Hours) {
        // If 24 hours, openTime and closeTime should be null
        continue;
      }

      // If not closed and not 24 hours, openTime and closeTime are required
      if (!hours.openTime || !hours.closeTime) {
        throw new BadRequestException(`Open and close times are required for ${hours.dayOfWeek}`);
      }

      // Validate that close time is after open time
      if (hours.openTime >= hours.closeTime) {
        throw new BadRequestException(`Close time must be after open time for ${hours.dayOfWeek}`);
      }

      // Validate break times if provided
      if (hours.breakStartTime || hours.breakEndTime) {
        if (!hours.breakStartTime || !hours.breakEndTime) {
          throw new BadRequestException(`Both break start and end times must be provided for ${hours.dayOfWeek}`);
        }

        if (hours.breakStartTime >= hours.breakEndTime) {
          throw new BadRequestException(`Break end time must be after break start time for ${hours.dayOfWeek}`);
        }

        // Break must be within business hours
        if (hours.breakStartTime < hours.openTime || hours.breakEndTime > hours.closeTime) {
          throw new BadRequestException(`Break time must be within business hours for ${hours.dayOfWeek}`);
        }
      }
    }
  }

  private getCurrentDayOfWeek(date: Date): DayOfWeek {
    const days = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[date.getDay()];
  }

  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5); // HH:MM format
  }
}
```
#### 3.4 Add Business Hours Endpoints to Merchant Controller

Update `src/profiles/controllers/merchant-profiles.controller.ts` to include:

```typescript
import { BusinessHoursService } from '../services/business-hours.service';
import { UpdateBusinessHoursDto } from '../dto/business-hours.dto';

// Add to constructor
constructor(
  private readonly profilesService: ProfilesService,
  private readonly businessHoursService: BusinessHoursService,
) {}

// Add these endpoints
@Put('business-hours')
@ApiOperation({ summary: 'Update merchant business hours' })
async updateBusinessHours(
  @Request() req,
  @Body() dto: UpdateBusinessHoursDto,
): Promise<any> {
  const profile = await this.profilesService.getMerchantProfile(req.user.sub);
  const businessHours = await this.businessHoursService.updateBusinessHours(profile.id, dto.businessHours);
  return { success: true, businessHours };
}

@Get('business-hours')
@ApiOperation({ summary: 'Get merchant business hours' })
async getBusinessHours(@Request() req): Promise<any> {
  const profile = await this.profilesService.getMerchantProfile(req.user.sub);
  const businessHours = await this.businessHoursService.getBusinessHours(profile.id);
  return { businessHours };
}

@Get('is-open')
@ApiOperation({ summary: 'Check if merchant is currently open' })
async isOpen(@Request() req): Promise<any> {
  const profile = await this.profilesService.getMerchantProfile(req.user.sub);
  const isOpen = await this.businessHoursService.isOpenNow(profile.id);
  return { isOpen };
}
```

### Task 6: Add Comprehensive Validation and Testing

**Objective**: Implement input validation, business rules, and testing

#### 6.1 Create Custom Validation Decorators

Create `src/common/decorators/validation.decorators.ts`:

```typescript
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsTimeFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTimeFormat',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Allow optional fields
          return typeof value === 'string' && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
        },
      },
    });
  };
}

export function IsValidImageUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidImageUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Allow optional fields
          const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|webp)(\?.*)?$/i;
          return typeof value === 'string' && urlPattern.test(value);
        },
      },
    });
  };
}
```

#### 6.2 Create Validation Pipes

Create `src/common/pipes/validation.pipe.ts`:

```typescript
import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => {
        return Object.values(error.constraints || {}).join(', ');
      }).join('; ');
      
      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

#### 6.3 Create Exception Filters

Create `src/common/filters/http-exception.filter.ts`:

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || null,
    };

    this.logger.error(
      `HTTP Exception: ${request.method} ${request.url} - Status: ${status} - Message: ${exception.message}`,
    );

    response.status(status).json(errorResponse);
  }
}
```
#### 6.4 Unit Tests for Profile Services

Create `src/profiles/services/__tests__/profiles.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfilesService } from '../profiles.service';
import { CustomerProfile } from '../../entities/customer-profile.entity';
import { MerchantProfile } from '../../entities/merchant-profile.entity';
import { User } from '../../../users/entities/user.entity';
import { UserRole } from '../../../users/enums/user-role.enum';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let customerProfileRepository: Repository<CustomerProfile>;
  let merchantProfileRepository: Repository<MerchantProfile>;
  let userRepository: Repository<User>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: getRepositoryToken(CustomerProfile),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(MerchantProfile),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    customerProfileRepository = module.get<Repository<CustomerProfile>>(getRepositoryToken(CustomerProfile));
    merchantProfileRepository = module.get<Repository<MerchantProfile>>(getRepositoryToken(MerchantProfile));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomerProfile', () => {
    const userId = 'user-123';
    const createDto = {
      bio: 'Test bio',
      preferredLanguage: 'en',
    };

    it('should create customer profile successfully', async () => {
      const user = { id: userId, role: UserRole.CUSTOMER } as User;
      const createdProfile = { id: 'profile-123', userId, ...createDto } as CustomerProfile;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(customerProfileRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(customerProfileRepository, 'create').mockReturnValue(createdProfile);
      jest.spyOn(customerProfileRepository, 'save').mockResolvedValue(createdProfile);

      const result = await service.createCustomerProfile(userId, createDto);

      expect(result).toEqual(createdProfile);
      expect(customerProfileRepository.create).toHaveBeenCalledWith({
        userId,
        ...createDto,
        isProfileComplete: false,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createCustomerProfile(userId, createDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when user is not a customer', async () => {
      const user = { id: userId, role: UserRole.MERCHANT } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      await expect(service.createCustomerProfile(userId, createDto))
        .rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when profile already exists', async () => {
      const user = { id: userId, role: UserRole.CUSTOMER } as User;
      const existingProfile = { id: 'existing-123' } as CustomerProfile;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(customerProfileRepository, 'findOne').mockResolvedValue(existingProfile);

      await expect(service.createCustomerProfile(userId, createDto))
        .rejects.toThrow(ConflictException);
    });
  });
});
```

#### 6.5 Integration Tests for Upload Service

Create `src/uploads/services/__tests__/uploads.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { UploadsService, UploadType } from '../uploads.service';

describe('UploadsService', () => {
  let service: UploadsService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock configuration values
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      const config = {
        'aws.region': 'us-east-1',
        'aws.accessKeyId': 'test-key',
        'aws.secretAccessKey': 'test-secret',
        'aws.s3Bucket': 'test-bucket',
        'aws.cdnUrl': 'https://cdn.example.com',
      };
      return config[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePresignedUrl', () => {
    it('should throw BadRequestException for invalid content type', async () => {
      await expect(
        service.generatePresignedUrl(
          'test.txt',
          'text/plain',
          UploadType.AVATAR,
          'user-123'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid image content types for avatar', async () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      
      for (const contentType of validTypes) {
        await expect(
          service.generatePresignedUrl(
            'test.jpg',
            contentType,
            UploadType.AVATAR,
            'user-123'
          )
        ).resolves.toBeDefined();
      }
    });
  });
});
```
## Implementation Steps

### Phase 1: Setup and Core Entities (Days 1-2)

1. **Developer 1**: Create profile entities and DTOs
   - Create `CustomerProfile` and `MerchantProfile` entities
   - Create validation DTOs for create/update operations
   - Create response DTOs with proper mapping

2. **Developer 2**: Setup upload infrastructure
   - Configure AWS S3 settings
   - Create upload module and service
   - Implement presigned URL generation

### Phase 2: Business Logic (Days 3-4)

3. **Developer 1**: Implement profile services and controllers
   - Create `ProfilesService` with CRUD operations
   - Implement profile controllers with proper guards
   - Add profile completion tracking

4. **Developer 2**: Build business hours system
   - Create `BusinessHours` entity and service
   - Implement time validation and business rules
   - Add "is open now" functionality

### Phase 3: Authentication Enhancement (Days 4-5)

5. **Developer 1**: Enhance authentication responses
   - Update auth DTOs to include role information
   - Modify JWT payload to include role claims
   - Ensure frontend gets role for routing

### Phase 4: Validation and Testing (Days 5-6)

6. **Developer 2**: Add validation and testing
   - Create custom validation decorators
   - Implement comprehensive error handling
   - Write unit tests for services

### Phase 5: Integration and Module Registration (Day 6)

7. **Both Developers**: Module integration
   - Register new modules in `app.module.ts`
   - Run database migrations
   - Test API endpoints with Postman/Swagger

## Frontend Contract Responses

Based on the frontend questions, here are the exact responses:

### 1. Profile Table/Schema Shape

**Customer Profile Fields:**
```typescript
{
  id: string;
  userId: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  bio?: string;
  preferredLanguage: string; // default: 'en'
  notificationPreferences: Record<string, boolean>;
  savedAddresses: Array<{
    id: string;
    label: string;
    address: string;
    latitude: number;
    longitude: number;
  }>;
  loyaltyPoints: number; // default: 0
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Merchant Profile Fields:**
```typescript
{
  id: string;
  userId: string;
  businessName: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  businessAddress?: string;
  latitude?: number;
  longitude?: number;
  websiteUrl?: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  businessCategories: string[];
  servicesOffered: Array<{
    id: string;
    name: string;
    description?: string;
    price?: number;
    currency?: string;
  }>;
  businessHours: BusinessHours[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDocuments: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
  averageRating: number;
  totalReviews: number;
  isProfileComplete: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Presigned-Upload Endpoint Contract

**Request:** `POST /api/uploads/presign`
```typescript
{
  filename: string;
  contentType: string; // 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'
  uploadType: 'avatar' | 'logo' | 'banner' | 'document';
}
```

**Response:**
```typescript
{
  uploadUrl: string; // S3 presigned URL for upload
  fileUrl: string;   // Final CDN URL for the file
  key: string;       // S3 object key
}
```

### 3. Business Hours Data Structure

**Database Storage:** Related table with per-day records

**Format:**
```typescript
[
  {
    dayOfWeek: "Monday",
    openTime: "08:00",
    closeTime: "17:00",
    isClosed: false,
    is24Hours: false,
    breakStartTime?: "12:00",
    breakEndTime?: "13:00"
  },
  // ... for each day of the week
]
```

**Special Cases:**
- Closed all day: `{ dayOfWeek: "Sunday", isClosed: true }`
- Open 24 hours: `{ dayOfWeek: "Friday", is24Hours: true }`

### 4. Role Cookie & JWT Claims

**Login Response:**
```typescript
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'Customer' | 'Merchant' | 'Moderator' | 'Admin';
    // ... other user fields
  };
  role: string; // Duplicate for easy access
}
```

**JWT Claims:**
```typescript
{
  sub: string; // user id
  email: string;
  role: string; // 'Customer' | 'Merchant' | 'Moderator' | 'Admin'
  iat: number;
  exp: number;
}
```

## Environment Variables Required

Add to `.env`:

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=yegnafinder-uploads
AWS_S3_CDN_URL=https://cdn.yegnafinder.com
```

## Database Migration Commands

```bash
# Generate migration
npm run typeorm:generate-migration -- src/migrations/CreateProfiles

# Run migration
npm run typeorm:run-migrations
```

## API Endpoints Summary

### Customer Profiles
- `POST /api/profiles/customer` - Create customer profile
- `GET /api/profiles/customer` - Get customer profile
- `PUT /api/profiles/customer` - Update customer profile

### Merchant Profiles
- `POST /api/profiles/merchant` - Create merchant profile
- `GET /api/profiles/merchant` - Get merchant profile
- `PUT /api/profiles/merchant` - Update merchant profile
- `PUT /api/profiles/merchant/business-hours` - Update business hours
- `GET /api/profiles/merchant/business-hours` - Get business hours
- `GET /api/profiles/merchant/is-open` - Check if currently open

### Uploads
- `POST /api/uploads/presign` - Generate presigned URL

## Testing Strategy

1. **Unit Tests**: Service layer business logic
2. **Integration Tests**: API endpoint behavior
3. **E2E Tests**: Complete user flows
4. **Manual Testing**: Postman collection for all endpoints

This implementation provides a complete, production-ready profile and upload system that meets all frontend requirements while maintaining security, scalability, and code quality standards.
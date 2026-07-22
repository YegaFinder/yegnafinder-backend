import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { Business } from '../entities/business.entity';
import {
  CreateProfileDto,
  UpdateProfileDto,
} from '../dto/create-profile.dto';
import {
  CreateBusinessDto,
  UpdateBusinessDto,
} from '../dto/create-business.dto';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Customer Profile Methods
  async createCustomerProfile(
    userId: string,
    dto: CreateProfileDto,
  ): Promise<Profile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.CUSTOMER)
      throw new ConflictException('User is not a customer');

    const existingProfile = await this.profileRepository.findOne({
      where: { userId },
    });
    if (existingProfile)
      throw new ConflictException('Customer profile already exists');

    const profile = this.profileRepository.create({
      userId,
      ...dto,
      isProfileComplete: this.checkCustomerProfileCompletion(
        dto as Partial<Profile>,
      ),
    });

    return this.profileRepository.save(profile);
  }

  async getCustomerProfile(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!profile) throw new NotFoundException('Customer profile not found');
    return profile;
  }

  async updateCustomerProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<Profile> {
    const profile = await this.getCustomerProfile(userId);
    Object.assign(profile, dto);
    profile.isProfileComplete = this.checkCustomerProfileCompletion(profile);
    return this.profileRepository.save(profile);
  }

  // Merchant Profile Methods
  async createMerchantProfile(
    userId: string,
    dto: CreateBusinessDto,
  ): Promise<Business> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.MERCHANT)
      throw new ConflictException('User is not a merchant');

    const existingProfile = await this.businessRepository.findOne({
      where: { userId },
    });
    if (existingProfile)
      throw new ConflictException('Merchant profile already exists');

    const { businessCategories, ...restDto } = dto;

    const profile = this.businessRepository.create({
      userId,
      ...restDto,
      isProfileComplete: this.checkMerchantProfileCompletion(dto as any),
    });

    return this.businessRepository.save(profile);
  }

  async getMerchantProfile(userId: string): Promise<Business> {
    const profile = await this.businessRepository.findOne({
      where: { userId },
      relations: { user: true, businessHours: true },
    });
    if (!profile) throw new NotFoundException('Merchant profile not found');
    return profile;
  }

  async updateMerchantProfile(
    userId: string,
    dto: UpdateBusinessDto,
  ): Promise<Business> {
    const profile = await this.getMerchantProfile(userId);
    const { businessCategories, ...restDto } = dto;
    Object.assign(profile, restDto);
    profile.isProfileComplete = this.checkMerchantProfileCompletion(profile as any);
    return this.businessRepository.save(profile);
  }

  // Helper Methods
  private checkCustomerProfileCompletion(
    profile: Partial<Profile>,
  ): boolean {
    return !!(profile.avatarUrl && profile.bio && profile.preferredLanguage);
  }

  private checkMerchantProfileCompletion(
    profile: Partial<Business>,
  ): boolean {
    return !!(
      profile.businessName &&
      profile.description &&
      profile.logoUrl &&
      profile.businessAddress &&
      profile.contactPhone
    );
  }
}

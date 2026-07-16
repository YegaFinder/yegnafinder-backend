import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { MerchantProfile } from '../entities/merchant-profile.entity';
import {
  CreateCustomerProfileDto,
  UpdateCustomerProfileDto,
} from '../dto/create-customer-profile.dto';
import {
  CreateMerchantProfileDto,
  UpdateMerchantProfileDto,
} from '../dto/create-merchant-profile.dto';
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
  async createCustomerProfile(
    userId: string,
    dto: CreateCustomerProfileDto,
  ): Promise<CustomerProfile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.CUSTOMER)
      throw new ConflictException('User is not a customer');

    const existingProfile = await this.customerProfileRepository.findOne({
      where: { userId },
    });
    if (existingProfile)
      throw new ConflictException('Customer profile already exists');

    const profile = this.customerProfileRepository.create({
      userId,
      ...dto,
      isProfileComplete: this.checkCustomerProfileCompletion(
        dto as Partial<CustomerProfile>,
      ),
    });

    return this.customerProfileRepository.save(profile);
  }

  async getCustomerProfile(userId: string): Promise<CustomerProfile> {
    const profile = await this.customerProfileRepository.findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!profile) throw new NotFoundException('Customer profile not found');
    return profile;
  }

  async updateCustomerProfile(
    userId: string,
    dto: UpdateCustomerProfileDto,
  ): Promise<CustomerProfile> {
    const profile = await this.getCustomerProfile(userId);
    Object.assign(profile, dto);
    profile.isProfileComplete = this.checkCustomerProfileCompletion(profile);
    return this.customerProfileRepository.save(profile);
  }

  // Merchant Profile Methods
  async createMerchantProfile(
    userId: string,
    dto: CreateMerchantProfileDto,
  ): Promise<MerchantProfile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.MERCHANT)
      throw new ConflictException('User is not a merchant');

    const existingProfile = await this.merchantProfileRepository.findOne({
      where: { userId },
    });
    if (existingProfile)
      throw new ConflictException('Merchant profile already exists');

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
      relations: { user: true, businessHours: true },
    });
    if (!profile) throw new NotFoundException('Merchant profile not found');
    return profile;
  }

  async updateMerchantProfile(
    userId: string,
    dto: UpdateMerchantProfileDto,
  ): Promise<MerchantProfile> {
    const profile = await this.getMerchantProfile(userId);
    Object.assign(profile, dto);
    profile.isProfileComplete = this.checkMerchantProfileCompletion(profile);
    return this.merchantProfileRepository.save(profile);
  }

  // Helper Methods
  private checkCustomerProfileCompletion(
    profile: Partial<CustomerProfile>,
  ): boolean {
    return !!(profile.avatarUrl && profile.bio && profile.preferredLanguage);
  }

  private checkMerchantProfileCompletion(
    profile: Partial<MerchantProfile>,
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

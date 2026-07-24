import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessStaff } from '../entities/business-staff.entity';
import { Business } from '../entities/business.entity';

@Injectable()
export class BusinessStaffService {
  constructor(
    @InjectRepository(BusinessStaff)
    private readonly staffRepository: Repository<BusinessStaff>,
  ) {}

  async getStaff(businessId: string): Promise<BusinessStaff[]> {
    return this.staffRepository.find({ where: { businessId }, relations: { user: true } });
  }

  async addStaff(businessId: string, userId: string, role: string): Promise<BusinessStaff> {
    const staff = this.staffRepository.create({ businessId, userId, role });
    return this.staffRepository.save(staff);
  }

  async removeStaff(businessId: string, staffId: string): Promise<void> {
    await this.staffRepository.delete({ id: staffId, businessId });
  }
}

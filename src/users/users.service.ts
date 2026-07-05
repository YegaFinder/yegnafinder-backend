import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, firstName, lastName, phone, role } = createUserDto;

    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    if (phone) {
      const existingPhone = await this.usersRepository.findOne({ where: { phone } });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const passwordHash = await User.hashPassword(password);

    const user = this.usersRepository.create({
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
      role: role || UserRole.CUSTOMER,
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.usersRepository.update(id, { isEmailVerified: true });
  }

  async updatePassword(id: string, newPasswordHash: string): Promise<void> {
    await this.usersRepository.update(id, { passwordHash: newPasswordHash });
  }
}

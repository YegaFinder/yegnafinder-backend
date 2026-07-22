import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
      const existingPhone = await this.usersRepository.findOne({
        where: { phone },
      });
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
      hasAcceptedTerms: createUserDto.agreedToTerms === true,
      termsAcceptedAt: createUserDto.agreedToTerms === true ? new Date() : undefined,
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

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  /**
   * Find an existing user by Google ID or email, or create a new one if they've
   * never logged in via Google before. Marks the account as email-verified since
   * Google has already validated the address.
   */
  async findOrCreateGoogleUser(opts: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    // 1. Already linked to Google — fast path
    const byGoogleId = await this.usersRepository.findOne({
      where: { googleId: opts.googleId },
    });
    if (byGoogleId) return byGoogleId;

    // 2. Existing email account — link it
    const byEmail = await this.findByEmail(opts.email);
    if (byEmail) {
      await this.usersRepository.update(byEmail.id, {
        googleId: opts.googleId,
        isEmailVerified: true,
      });
      return {
        ...byEmail,
        googleId: opts.googleId,
        isEmailVerified: true,
      } as User;
    }

    // 3. Brand-new user — register without a password
    const user = this.usersRepository.create({
      firstName: opts.firstName,
      lastName: opts.lastName,
      email: opts.email,
      googleId: opts.googleId,
      role: UserRole.CUSTOMER,
      isEmailVerified: true, // Google already verified the email
      hasAcceptedTerms: true,
      termsAcceptedAt: new Date(),
    });
    return this.usersRepository.save(user);
  }
}

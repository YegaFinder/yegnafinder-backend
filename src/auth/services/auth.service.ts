import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { SessionCacheService } from './session-cache.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RequestPasswordResetDto } from '../dto/request-password-reset.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private otpService: OtpService,
    private tokenService: TokenService,
    private sessionCacheService: SessionCacheService,
  ) {}

  async register(registerDto: RegisterDto): Promise<void> {
    const user = await this.usersService.create(registerDto);
    const otp = this.otpService.generateOtp();
    await this.otpService.storeOtp('verify', user.email, otp);
  }

  async login(
    loginDto: LoginDto,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    await this.sessionCacheService.checkLoginRateLimit(ipAddress, email);

    const user = await this.usersService.findByEmail(email);

    if (!user || !(await user.validatePassword(password))) {
      await this.sessionCacheService.incrementLoginRateLimit(ipAddress, email);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      await this.sessionCacheService.incrementLoginRateLimit(ipAddress, email);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Email not verified');
    }

    await this.usersService.updateLastLogin(user.id);
    await this.sessionCacheService.resetLoginRateLimit(ipAddress, email);

    return this.tokenService.issueTokenPair(user, deviceInfo, ipAddress);
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<void> {
    const { email, otp } = verifyOtpDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.otpService.verifyOtp('verify', email, otp);
    await this.usersService.markEmailVerified(user.id);
  }

  async requestPasswordReset(requestDto: RequestPasswordResetDto): Promise<void> {
    const user = await this.usersService.findByEmail(requestDto.email);
    if (user) {
      const otp = this.otpService.generateOtp();
      await this.otpService.storeOtp('reset', user.email, otp);
    }
  }

  async resetPassword(resetDto: ResetPasswordDto): Promise<void> {
    const { email, otp, newPassword } = resetDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.otpService.verifyOtp('reset', email, otp);
    const newPasswordHash = await User.hashPassword(newPassword);
    await this.usersService.updatePassword(user.id, newPasswordHash);
  }
}

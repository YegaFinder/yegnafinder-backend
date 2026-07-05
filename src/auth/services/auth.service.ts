import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { OtpService } from './otp.service';
import { RegisterDto } from '../dto/register.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RequestPasswordResetDto } from '../dto/request-password-reset.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private otpService: OtpService,
  ) {}

  async register(registerDto: RegisterDto): Promise<void> {
    const user = await this.usersService.create(registerDto);
    const otp = this.otpService.generateOtp();
    await this.otpService.storeOtp('verify', user.email, otp);
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
    // Don't throw if user not found to prevent email enumeration
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

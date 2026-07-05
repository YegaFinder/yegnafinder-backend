import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly expirySeconds: number;
  private readonly otpLength: number;
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.expirySeconds = this.configService.get<number>('OTP_EXPIRY_SECONDS', 300);
    this.otpLength = this.configService.get<number>('OTP_LENGTH', 6);
  }

  generateOtp(): string {
    const min = Math.pow(10, this.otpLength - 1);
    const max = Math.pow(10, this.otpLength) - 1;
    return crypto.randomInt(min, max).toString();
  }

  async storeOtp(type: 'verify' | 'reset', email: string, otp: string): Promise<void> {
    const key = `otp:${type}:${email}`;
    const value = { otp, attempts: 0 };
    // cache-manager v5 uses milliseconds
    await this.cacheManager.set(key, value, this.expirySeconds * 1000);
    
    // For Sprint 1 development, log OTP to console
    console.log(`[DEVELOPMENT] OTP for ${email} (${type}): ${otp}`);
  }

  async verifyOtp(type: 'verify' | 'reset', email: string, providedOtp: string): Promise<boolean> {
    const key = `otp:${type}:${email}`;
    const data: { otp: string; attempts: number } | undefined = await this.cacheManager.get(key);

    if (!data) {
      throw new BadRequestException('OTP has expired or does not exist');
    }

    if (data.attempts >= this.MAX_ATTEMPTS) {
      await this.cacheManager.del(key);
      throw new BadRequestException('Too many failed attempts. Please request a new OTP');
    }

    if (data.otp !== providedOtp) {
      data.attempts += 1;
      await this.cacheManager.set(key, data, this.expirySeconds * 1000);
      throw new BadRequestException('Invalid OTP');
    }

    await this.cacheManager.del(key);
    return true;
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../../users/users.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { RefreshTokenService } from './refresh-token.service';
import { SessionCacheService } from './session-cache.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RequestPasswordResetDto } from '../dto/request-password-reset.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private otpService: OtpService,
    private tokenService: TokenService,
    private refreshTokenService: RefreshTokenService,
    private sessionCacheService: SessionCacheService,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID', ''),
    );
  }

  async register(registerDto: RegisterDto): Promise<string | null> {
    const user = await this.usersService.create(registerDto);
    const otp = this.otpService.generateOtp();
    return await this.otpService.storeOtp('verify', user.email, otp);
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
      throw new ForbiddenException('Email not verified. Please verify your email before logging in.');
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

  async resendVerificationOtp(email: string): Promise<string | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isEmailVerified) {
      throw new ForbiddenException('Email is already verified');
    }
    const otp = this.otpService.generateOtp();
    return await this.otpService.storeOtp('verify', user.email, otp);
  }

  async requestPasswordReset(requestDto: RequestPasswordResetDto): Promise<string | null> {
    const user = await this.usersService.findByEmail(requestDto.email);
    if (user) {
      const otp = this.otpService.generateOtp();
      return await this.otpService.storeOtp('reset', user.email, otp);
    }
    return null;
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

  /**
   * Rotate a refresh token — invalidate the old one and issue a new pair.
   * Implements token rotation: if an already-revoked token is presented,
   * the entire family is revoked (replay-attack detection upstream in
   * RefreshTokenService.validate).
   */
  async refresh(
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    return this.tokenService.rotateRefreshToken(refreshToken, deviceInfo, ipAddress);
  }

  /**
   * Logout from a single device — revoke the presented refresh token.
   */
  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenService.revoke(refreshToken);
  }

  /**
   * Logout from all devices — revoke every active refresh token for the user.
   */
  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllForUser(userId);
  }

  /**
   * Return the current authenticated user's profile.
   */
  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    return new UserResponseDto(user);
  }

  /**
   * Verify a Google idToken (issued by the frontend SDK / mobile app) and
   * either log in the existing user or auto-register a new Customer account.
   * No password is required — Google has already authenticated the user.
   */
  async googleLogin(
    idToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    let ticket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      });
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedException('Google token did not contain an email address');
    }

    const user = await this.usersService.findOrCreateGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name ?? payload.email.split('@')[0],
      lastName: payload.family_name ?? '',
    });

    await this.usersService.updateLastLogin(user.id);
    return this.tokenService.issueTokenPair(user, deviceInfo, ipAddress);
  }
}

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { User } from '../../users/entities/user.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async issueTokenPair(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.refreshTokenService.create(
      user,
      deviceInfo,
      ipAddress,
    );

    return {
      accessToken,
      refreshToken,
      user: new UserResponseDto(user),
    };
  }

  async generateAccessToken(user: User): Promise<string> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_EXPIRES_IN',
      ) as StringValue,
    });
  }

  async rotateRefreshToken(
    oldToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<string> {
    const existing = await this.refreshTokenService.validate(oldToken);
    await this.refreshTokenService.revoke(oldToken);
    return this.refreshTokenService.create(
      existing.user,
      deviceInfo,
      ipAddress,
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllForUser(userId);
  }
}

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { User } from '../../users/entities/user.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { RefreshTokenService } from './refresh-token.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

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

    const userDto = new UserResponseDto(user);
    return new AuthResponseDto({
      accessToken,
      refreshToken,
      user: userDto,
    });
  }

  async generateAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
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
  ): Promise<AuthResponseDto> {
    const existing = await this.refreshTokenService.validate(oldToken);
    await this.refreshTokenService.revoke(oldToken);
    return this.issueTokenPair(existing.user, deviceInfo, ipAddress);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllForUser(userId);
  }
}

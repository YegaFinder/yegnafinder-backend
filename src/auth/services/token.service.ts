import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { SessionCacheService } from './session-cache.service';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private sessionCacheService: SessionCacheService,
  ) {}

  async issueTokenPair(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(
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

  async generateRefreshToken(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const expiresAt = this.getRefreshExpiryDate();

    const refreshToken = this.refreshTokenRepository.create({
      user,
      tokenHash,
      deviceInfo,
      ipAddress,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);

    await this.sessionCacheService.cacheSession(tokenHash, {
      userId: user.id,
      deviceInfo,
      ipAddress,
    });

    return token;
  }

  async rotateRefreshToken(
    oldToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<string> {
    const tokenHash = crypto.createHash('sha256').update(oldToken).digest('hex');
    const existingToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (
      !existingToken ||
      existingToken.isRevoked ||
      existingToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    existingToken.isRevoked = true;
    await this.refreshTokenRepository.save(existingToken);
    await this.sessionCacheService.deleteSession(tokenHash);

    return this.generateRefreshToken(existingToken.user, deviceInfo, ipAddress);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { user: { id: userId } as User, isRevoked: false },
      { isRevoked: true },
    );
  }

  private getRefreshExpiryDate(): Date {
    const expiresInStr = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const days = parseInt(expiresInStr.replace('d', ''), 10) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
  }
}

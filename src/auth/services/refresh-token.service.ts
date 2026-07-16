import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';
import { SessionCacheService } from './session-cache.service';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService,
    private readonly sessionCacheService: SessionCacheService,
  ) {}

  async create(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = this.getExpiryDate();

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

  async validate(plainToken: string): Promise<RefreshToken> {
    const tokenHash = this.hashToken(plainToken);
    const stored = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return stored;
  }

  async revoke(plainToken: string): Promise<void> {
    const tokenHash = this.hashToken(plainToken);
    await this.refreshTokenRepository.update(
      { tokenHash },
      { isRevoked: true },
    );
    await this.sessionCacheService.deleteSession(tokenHash);
  }

  /**
   * Revoke all active tokens for a user and purge their Redis session cache.
   * This is used for "logout all devices" — invalidating every active session.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    // Fetch all active token hashes before revoking, so we can clear Redis
    const activeTokens = await this.refreshTokenRepository.find({
      where: { user: { id: userId } as User, isRevoked: false },
      select: { tokenHash: true },
    });

    // Mark all as revoked in PostgreSQL
    await this.refreshTokenRepository.update(
      { user: { id: userId } as User, isRevoked: false },
      { isRevoked: true },
    );

    // Remove each session entry from Redis
    await Promise.all(
      activeTokens.map((t) =>
        this.sessionCacheService.deleteSession(t.tokenHash),
      ),
    );
  }

  private hashToken(plainToken: string): string {
    return crypto.createHash('sha256').update(plainToken).digest('hex');
  }

  private getExpiryDate(): Date {
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

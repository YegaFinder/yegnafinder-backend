import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async generateAccessToken(user: User): Promise<string> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });
  }

  async generateRefreshToken(user: User, deviceInfo?: string, ipAddress?: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const expiresInStr = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const days = parseInt(expiresInStr.replace('d', ''), 10) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const refreshToken = this.refreshTokenRepository.create({
      user,
      tokenHash,
      deviceInfo,
      ipAddress,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);
    return token;
  }

  async rotateRefreshToken(oldToken: string, deviceInfo?: string, ipAddress?: string): Promise<string> {
    const tokenHash = crypto.createHash('sha256').update(oldToken).digest('hex');
    const existingToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!existingToken || existingToken.isRevoked || existingToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    existingToken.isRevoked = true;
    await this.refreshTokenRepository.save(existingToken);

    return this.generateRefreshToken(existingToken.user, deviceInfo, ipAddress);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { user: { id: userId } as User, isRevoked: false },
      { isRevoked: true }
    );
  }
}

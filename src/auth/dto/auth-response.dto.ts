import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({ description: 'Short-lived JWT access token (Bearer)' })
  accessToken: string;

  @ApiProperty({ description: 'Long-lived opaque refresh token' })
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ description: 'User role for frontend routing' })
  role: string;

  constructor(data: { accessToken: string; refreshToken: string; user: UserResponseDto }) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.user = data.user;
    this.role = data.user.role; // Extract role from user for easy access
  }
}

/** Standard JSON envelope every endpoint returns. */
export class ApiEnvelope<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: 'Operation successful', required: false })
  message?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({ description: 'Short-lived JWT access token (Bearer)' })
  accessToken: string;

  @ApiProperty({ description: 'Long-lived opaque refresh token' })
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
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

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({ description: 'The Google OAuth 2.0 idToken received from the client SDK' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

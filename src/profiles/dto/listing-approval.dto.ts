import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RejectListingDto {
  @ApiProperty({ example: 'Incomplete business address and missing logo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason: string;
}

export class SubmitListingDto {
  @ApiPropertyOptional({
    example: 'Ready for review after updating hours and gallery',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

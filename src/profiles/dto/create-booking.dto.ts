import { IsString, IsNotEmpty, IsDateString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'The ID of the business to book' })
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @ApiProperty({ description: 'The time of the appointment', example: '2023-12-01T14:30:00Z' })
  @IsDateString()
  @IsNotEmpty()
  appointmentTime: string;

  @ApiPropertyOptional({ description: 'Optional notes for the merchant' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

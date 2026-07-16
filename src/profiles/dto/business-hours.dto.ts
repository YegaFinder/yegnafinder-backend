import { Type } from 'class-transformer';
import {
  IsEnum,
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '../entities/business-hours.entity';

export class BusinessHoursDto {
  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiPropertyOptional({
    example: '08:00',
    description: 'Opening time in HH:MM format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openTime must be in HH:MM format (24-hour)',
  })
  @ValidateIf((o: BusinessHoursDto) => !o.isClosed && !o.is24Hours)
  openTime?: string;

  @ApiPropertyOptional({
    example: '17:00',
    description: 'Closing time in HH:MM format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closeTime must be in HH:MM format (24-hour)',
  })
  @ValidateIf((o: BusinessHoursDto) => !o.isClosed && !o.is24Hours)
  closeTime?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Is the business closed on this day',
  })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Is the business open 24 hours on this day',
  })
  @IsOptional()
  @IsBoolean()
  is24Hours?: boolean;

  @ApiPropertyOptional({
    example: '12:00',
    description: 'Break start time in HH:MM format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'breakStartTime must be in HH:MM format (24-hour)',
  })
  breakStartTime?: string;

  @ApiPropertyOptional({
    example: '13:00',
    description: 'Break end time in HH:MM format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'breakEndTime must be in HH:MM format (24-hour)',
  })
  breakEndTime?: string;
}

export class UpdateBusinessHoursDto {
  @ApiProperty({ type: [BusinessHoursDto] })
  @IsArray()
  @ArrayMinSize(7)
  @ValidateNested({ each: true })
  @Type(() => BusinessHoursDto)
  businessHours: BusinessHoursDto[];
}

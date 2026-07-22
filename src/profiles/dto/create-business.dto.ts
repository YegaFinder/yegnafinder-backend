import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Bella Coffee House' })
  @IsString()
  businessName: string;

  @ApiPropertyOptional({
    example: 'Premium coffee and pastries in the heart of Addis',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.jpg' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.jpg' })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'contact@bellacoffee.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+251911234567' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Bole Road, Addis Ababa, Ethiopia' })
  @IsOptional()
  @IsString()
  businessAddress?: string;

  @ApiPropertyOptional({ example: 9.0054 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 38.7636 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'https://bellacoffee.com' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  businessCategories?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  servicesOffered?: Array<{
    id: string;
    name: string;
    description?: string;
    price?: number;
    currency?: string;
  }>;
}

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {}

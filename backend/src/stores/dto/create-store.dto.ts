import { IsString, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ description: 'Store name', example: 'My Awesome Store' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Store description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Store phone number', example: '+1234567890' })
  @IsString()
  @IsPhoneNumber(null)
  phone: string;

  @ApiPropertyOptional({ description: 'Store email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Store address' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'ZIP code' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;
}
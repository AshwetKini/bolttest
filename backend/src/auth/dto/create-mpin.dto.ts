import { IsString, IsPhoneNumber, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMpinDto {
  @ApiProperty({
    description: 'Phone number with country code',
    example: '+1234567890',
  })
  @IsString()
  @IsPhoneNumber(null, { message: 'Please provide a valid phone number' })
  phone: string;

  @ApiProperty({
    description: '4-6 digit MPIN',
    example: '1234',
  })
  @IsString()
  @Length(4, 6, { message: 'MPIN must be 4-6 digits' })
  @Matches(/^\d+$/, { message: 'MPIN must contain only digits' })
  mpin: string;
}
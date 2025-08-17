import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Otp, OtpDocument } from '../users/schemas/otp.schema';
import { RefreshToken, RefreshTokenDocument } from '../users/schemas/refresh-token.schema';
import { OtpService } from '../common/services/otp.service';
import { LoggerService } from '../common/services/logger.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CreateMpinDto } from './dto/create-mpin.dto';
import { LoginMpinDto } from './dto/login-mpin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private logger: LoggerService,
  ) {}

  async sendOtp(sendOtpDto: SendOtpDto) {
    const { phone } = sendOtpDto;

    // Generate OTP
    const otpCode = this.otpService.generateOTP();

    // Save or update OTP in database
    await this.otpModel.findOneAndUpdate(
      { phone },
      {
        phone,
        otp: otpCode,
        isVerified: false,
        createdAt: new Date(),
      },
      { upsert: true, new: true },
    );

    // Send OTP via SMS
    const sent = await this.otpService.sendOTP(phone, otpCode);

    if (!sent) {
      throw new BadRequestException('Failed to send OTP');
    }

    this.logger.log(`OTP sent to ${phone}`, 'AuthService');

    return {
      message: 'OTP sent successfully',
      phone,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { phone, otp } = verifyOtpDto;

    const otpRecord = await this.otpModel.findOne({ phone }).sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new BadRequestException('OTP not found or expired');
    }

    if (otpRecord.isVerified) {
      throw new BadRequestException('OTP already verified');
    }

    if (this.otpService.isOTPExpired(otpRecord.createdAt)) {
      throw new BadRequestException('OTP has expired');
    }

    if (!this.otpService.verifyOTP(otp, otpRecord.otp)) {
      throw new BadRequestException('Invalid OTP');
    }

    // Mark OTP as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    this.logger.log(`OTP verified for ${phone}`, 'AuthService');

    return {
      message: 'OTP verified successfully',
      phone,
      otpVerified: true,
    };
  }

  async createMpin(createMpinDto: CreateMpinDto) {
    const { phone, mpin } = createMpinDto;

    // Check if OTP was verified
    const otpRecord = await this.otpModel.findOne({
      phone,
      isVerified: true,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new BadRequestException('Please verify OTP first');
    }

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ phone });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash MPIN
    const mpinHash = await argon2.hash(mpin);

    // Create user
    const user = new this.userModel({
      phone,
      mpinHash,
      role: 'store_owner',
      isActive: true,
    });

    await user.save();

    this.logger.log(`User created for ${phone}`, 'AuthService');

    return {
      message: 'MPIN created successfully',
      userId: user._id,
    };
  }

  async loginMpin(loginMpinDto: LoginMpinDto) {
    const { phone, mpin } = loginMpinDto;

    const user = await this.userModel.findOne({ phone, isActive: true });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify MPIN
    const isValidMpin = await argon2.verify(user.mpinHash, mpin);
    if (!isValidMpin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = await this.generateTokens(user);

    this.logger.log(`User ${phone} logged in`, 'AuthService');

    return {
      message: 'Login successful',
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    const tokenRecord = await this.refreshTokenModel.findOne({
      token: refreshToken,
      isRevoked: false,
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.userModel.findById(tokenRecord.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Revoke old token
    tokenRecord.isRevoked = true;
    await tokenRecord.save();

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    return {
      message: 'Token refreshed successfully',
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken: string) {
    // Revoke refresh token
    await this.refreshTokenModel.updateOne(
      { userId, token: refreshToken },
      { isRevoked: true },
    );

    this.logger.log(`User ${userId} logged out`, 'AuthService');

    return {
      message: 'Logout successful',
    };
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // Save refresh token to database
    const refreshTokenDoc = new this.refreshTokenModel({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await refreshTokenDoc.save();

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateUser(userId: string) {
    const user = await this.userModel.findById(userId).select('-mpinHash');
    return user;
  }
}
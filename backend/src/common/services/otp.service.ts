import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OtpService {
  constructor(private configService: ConfigService) {}

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(phone: string, otp: string): Promise<boolean> {
    // Mock implementation for development
    if (this.configService.get('SMS_PROVIDER') === 'mock') {
      console.log(`🔐 OTP for ${phone}: ${otp}`);
      return true;
    }

    // In production, integrate with actual SMS provider (Twilio, AWS SNS, etc.)
    // Example:
    // const client = new TwilioClient(accountSid, authToken);
    // await client.messages.create({
    //   body: `Your Shopee verification code is: ${otp}`,
    //   from: twilioPhoneNumber,
    //   to: phone,
    // });

    return true;
  }

  verifyOTP(providedOTP: string, storedOTP: string): boolean {
    return providedOTP === storedOTP;
  }

  isOTPExpired(createdAt: Date, expiryMinutes = 5): boolean {
    const now = new Date();
    const expiryTime = new Date(createdAt.getTime() + expiryMinutes * 60000);
    return now > expiryTime;
  }
}
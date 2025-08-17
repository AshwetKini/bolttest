import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { PdfService } from './services/pdf.service';
import { OtpService } from './services/otp.service';

@Global()
@Module({
  providers: [LoggerService, PdfService, OtpService],
  exports: [LoggerService, PdfService, OtpService],
})
export class CommonModule {}
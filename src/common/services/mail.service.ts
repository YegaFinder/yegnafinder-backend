import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly logger = new Logger(MailService.name);
  private readonly isTestMode: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY', '');
    this.resend = new Resend(apiKey);
    const smtpFrom = this.configService.get<string>('SMTP_FROM');
    // Clean up the value: remove quotes and trim whitespace
    const cleanedFrom = smtpFrom?.trim().replace(/^["']|["']$/g, '') || '';
    // Validate email format - if invalid, use onboarding domain
    const isValidEmail = cleanedFrom.includes('@') && cleanedFrom.includes('.');
    this.from = isValidEmail ? cleanedFrom : 'onboarding@resend.dev';
    this.isTestMode =
      this.configService.get<string>('TEST_MODE', 'false') === 'true';
    this.logger.log(`[MailService] SMTP_FROM env value: "${smtpFrom}"`);
    this.logger.log(`[MailService] Cleaned from: ${cleanedFrom}`);
    this.logger.log(`[MailService] Is valid email: ${isValidEmail}`);
    this.logger.log(`[MailService] Using from: ${this.from}`);
    this.logger.log(`[MailService] API Key configured: ${!!apiKey}`);
    this.logger.log(`[MailService] TEST MODE: ${this.isTestMode}`);
  }

  async sendMail(opts: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    if (this.isTestMode) {
      // Extract OTP from HTML for logging
      const otpMatch = opts.html.match(/(\d{6})/);
      const otp = otpMatch ? otpMatch[1] : 'N/A';
      this.logger.log(`[TEST MODE] Email to ${opts.to} - OTP: ${otp}`);
      this.logger.log(`[TEST MODE] Subject: ${opts.subject}`);
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      if (error) {
        this.logger.error(
          `Resend error sending to ${opts.to}: ${JSON.stringify(error)}`,
        );
      }
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}: ${err}`);
    }
  }
}

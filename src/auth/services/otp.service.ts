import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import type { Cache } from 'cache-manager';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly expirySeconds: number;
  private readonly otpLength: number;
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {
    this.expirySeconds = this.configService.get<number>('OTP_EXPIRY_SECONDS', 300);
    this.otpLength = this.configService.get<number>('OTP_LENGTH', 6);
  }

  generateOtp(): string {
    const min = Math.pow(10, this.otpLength - 1);
    const max = Math.pow(10, this.otpLength) - 1;
    return crypto.randomInt(min, max).toString();
  }

  async storeOtp(type: 'verify' | 'reset', email: string, otp: string): Promise<void> {
    const key = `otp:${type}:${email}`;
    const value = { otp, attempts: 0 };
    await this.cacheManager.set(key, value, this.expirySeconds * 1000);
    await this.sendOtpEmail(type, email, otp);
  }

  async verifyOtp(type: 'verify' | 'reset', email: string, providedOtp: string): Promise<boolean> {
    const key = `otp:${type}:${email}`;
    const data: { otp: string; attempts: number } | undefined = await this.cacheManager.get(key);

    if (!data) {
      throw new BadRequestException('OTP has expired or does not exist');
    }

    if (data.attempts >= this.MAX_ATTEMPTS) {
      await this.cacheManager.del(key);
      throw new BadRequestException('Too many failed attempts. Please request a new OTP');
    }

    if (data.otp !== providedOtp) {
      data.attempts += 1;
      await this.cacheManager.set(key, data, this.expirySeconds * 1000);
      throw new BadRequestException('Invalid OTP');
    }

    await this.cacheManager.del(key);
    return true;
  }

  /* ------------------------------------------------------------------ */
  /*  Private — email sending                                             */
  /* ------------------------------------------------------------------ */

  private async sendOtpEmail(
    type: 'verify' | 'reset',
    email: string,
    otp: string,
  ): Promise<void> {
    const isVerify = type === 'verify';
    const subject = isVerify
      ? 'YegnaFinder — Verify Your Email'
      : 'YegnaFinder — Password Reset OTP';

    const title = isVerify ? 'Email Verification' : 'Password Reset';
    const bodyText = isVerify
      ? 'Use the code below to verify your email address.'
      : 'Use the code below to reset your password.';
    const expiryMinutes = Math.ceil(this.expirySeconds / 60);

    const html = this.buildOtpEmailHtml({ title, bodyText, otp, expiryMinutes });

    try {
      // Fire and forget — don't await so the API responds immediately.
      // The OTP is already stored in Redis; the email is best-effort.
      void this.mailerService.sendMail({ to: email, subject, html });
    } catch (err) {
      console.error(`[OtpService] Failed to send ${type} OTP email to ${email}:`, err);
    }
  }

  private buildOtpEmailHtml(opts: {
    title: string;
    bodyText: string;
    otp: string;
    expiryMinutes: number;
  }): string {
    const { title, bodyText, otp, expiryMinutes } = opts;
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F4F8FB;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F8FB;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;
                 box-shadow:0 4px 24px rgba(11,92,142,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0B5C8E 0%,#1673A6 100%);
                       padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;
                         letter-spacing:0.5px;">YegnaFinder</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
                Ethiopia's Smart Local Discovery Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#0A1B2B;font-size:20px;">${title}</h2>
              <p style="margin:0 0 28px;color:#4A5568;font-size:15px;line-height:1.6;">
                ${bodyText}
              </p>

              <!-- OTP Code Block -->
              <div style="background:#F4F8FB;border:1px solid #E5EAF0;border-radius:12px;
                          padding:24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:12px;color:#718096;
                          text-transform:uppercase;letter-spacing:1.5px;">Your verification code</p>
                <span style="font-size:42px;font-weight:700;color:#0B5C8E;
                             letter-spacing:12px;">${otp}</span>
              </div>

              <p style="margin:0;color:#718096;font-size:13px;line-height:1.6;">
                This code expires in <strong>${expiryMinutes} minutes</strong>.
                If you did not request this, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F4F8FB;border-top:1px solid #E5EAF0;
                       padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#A0AEC0;">
                &copy; ${new Date().getFullYear()} YegnaFinder &mdash; Phoenixopia Solution PLC
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}

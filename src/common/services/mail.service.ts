import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY', '');
    this.resend = new Resend(apiKey);
    this.from =
      this.configService.get<string>('SMTP_FROM') ||
      'noreply@yegnafinder.resend.dev';
  }

  async sendMail(opts: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      if (error) {
        this.logger.error(`Resend error sending to ${opts.to}: ${JSON.stringify(error)}`);
      }
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}: ${err}`);
    }
  }
}

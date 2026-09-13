import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { MailService } from '../../common/services/mail.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly mailService: MailService,
  ) {}

  async sendBookingConfirmation(opts: {
    to: string;
    userId?: string;
    businessId?: string;
    subject: string;
    html: string;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: opts.userId,
      businessId: opts.businessId,
      type: 'booking_confirmation',
      channel: 'email',
      title: opts.subject,
      body: opts.html,
      deliveryStatus: 'queued',
    });

    await this.notificationRepository.save(notification);

    await this.mailService.sendMail({
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });

    notification.deliveryStatus = 'sent';
    return this.notificationRepository.save(notification);
  }

  async sendReminder(opts: {
    to: string;
    userId?: string;
    businessId?: string;
    subject: string;
    html: string;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: opts.userId,
      businessId: opts.businessId,
      type: 'booking_reminder',
      channel: 'email',
      title: opts.subject,
      body: opts.html,
      deliveryStatus: 'queued',
    });

    await this.notificationRepository.save(notification);

    await this.mailService.sendMail({
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });

    notification.deliveryStatus = 'sent';
    return this.notificationRepository.save(notification);
  }
}

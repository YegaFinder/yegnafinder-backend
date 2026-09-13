import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { Booking } from '../entities/booking.entity';
import { MailService } from '../../common/services/mail.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly mailService: MailService,
  ) {}

  async sendBookingConfirmation(booking: Booking): Promise<void> {
    try {
      // Email notification
      const subject = `Booking Confirmation - ${booking.business.businessName}`;
      const html = this.generateBookingConfirmationHTML(booking);

      await this.mailService.sendMail({
        to: booking.customer.email,
        subject,
        html,
      });

      // Save in-app notification
      await this.createInAppNotification({
        userId: booking.customerId,
        businessId: booking.businessId,
        type: 'booking_confirmation',
        title: 'Booking Confirmed',
        body: `Your booking with ${booking.business.businessName} has been confirmed for ${new Date(booking.appointmentTime).toLocaleString()}.`,
      });

      this.logger.log(`Booking confirmation sent to ${booking.customer.email}`);
    } catch (error) {
      this.logger.error(`Failed to send booking confirmation: ${error.message}`);
    }
  }

  async sendBookingStatusUpdate(booking: Booking, status: string): Promise<void> {
    try {
      const subject = `Booking Status Update - ${booking.business.businessName}`;
      const html = this.generateBookingStatusUpdateHTML(booking, status);

      await this.mailService.sendMail({
        to: booking.customer.email,
        subject,
        html,
      });

      // Save in-app notification
      await this.createInAppNotification({
        userId: booking.customerId,
        businessId: booking.businessId,
        type: 'booking_status_update',
        title: 'Booking Status Updated',
        body: `Your booking with ${booking.business.businessName} status has been updated to ${status}.`,
      });

      this.logger.log(`Booking status update sent to ${booking.customer.email}`);
    } catch (error) {
      this.logger.error(`Failed to send booking status update: ${error.message}`);
    }
  }

  async sendBookingReminder(booking: Booking): Promise<void> {
    try {
      const subject = `Booking Reminder - ${booking.business.businessName}`;
      const html = this.generateBookingReminderHTML(booking);

      await this.mailService.sendMail({
        to: booking.customer.email,
        subject,
        html,
      });

      // Save in-app notification
      await this.createInAppNotification({
        userId: booking.customerId,
        businessId: booking.businessId,
        type: 'booking_reminder',
        title: 'Booking Reminder',
        body: `Reminder: Your appointment with ${booking.business.businessName} is scheduled for ${new Date(booking.appointmentTime).toLocaleString()}.`,
      });

      this.logger.log(`Booking reminder sent to ${booking.customer.email}`);
    } catch (error) {
      this.logger.error(`Failed to send booking reminder: ${error.message}`);
    }
  }

  private async createInAppNotification(data: {
    userId: string;
    businessId: string;
    type: string;
    title: string;
    body: string;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: data.userId,
      businessId: data.businessId,
      type: data.type,
      channel: 'in_app',
      title: data.title,
      body: data.body,
      deliveryStatus: 'sent',
    });

    return await this.notificationRepository.save(notification);
  }

  private generateBookingConfirmationHTML(booking: Booking): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Confirmed!</h2>
        <p>Dear ${booking.customer.firstName} ${booking.customer.lastName},</p>
        <p>Your booking with <strong>${booking.business.businessName}</strong> has been confirmed.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details:</h3>
          <p><strong>Business:</strong> ${booking.business.businessName}</p>
          <p><strong>Date & Time:</strong> ${new Date(booking.appointmentTime).toLocaleString()}</p>
          <p><strong>Status:</strong> ${booking.status}</p>
          ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
        </div>
        
        <p>We look forward to serving you!</p>
        <p>Best regards,<br>YegnaFinder Team</p>
      </div>
    `;
  }

  private generateBookingStatusUpdateHTML(booking: Booking, status: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Status Update</h2>
        <p>Dear ${booking.customer.firstName} ${booking.customer.lastName},</p>
        <p>Your booking with <strong>${booking.business.businessName}</strong> has been updated.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Updated Booking Details:</h3>
          <p><strong>Business:</strong> ${booking.business.businessName}</p>
          <p><strong>Date & Time:</strong> ${new Date(booking.appointmentTime).toLocaleString()}</p>
          <p><strong>New Status:</strong> <span style="color: ${this.getStatusColor(status)}; font-weight: bold;">${status}</span></p>
        </div>
        
        <p>If you have any questions, please contact the business directly.</p>
        <p>Best regards,<br>YegnaFinder Team</p>
      </div>
    `;
  }

  private generateBookingReminderHTML(booking: Booking): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Booking Reminder</h2>
        <p>Dear ${booking.customer.firstName} ${booking.customer.lastName},</p>
        <p>This is a friendly reminder about your upcoming appointment.</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3>Appointment Details:</h3>
          <p><strong>Business:</strong> ${booking.business.businessName}</p>
          <p><strong>Date & Time:</strong> ${new Date(booking.appointmentTime).toLocaleString()}</p>
          <p><strong>Address:</strong> ${booking.business.businessAddress || 'Contact business for location'}</p>
        </div>
        
        <p>Please arrive on time for your appointment.</p>
        <p>Best regards,<br>YegnaFinder Team</p>
      </div>
    `;
  }

  private getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
      case 'ACCEPTED': return '#10b981';
      case 'CONFIRMED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      case 'CANCELLED': return '#ef4444';
      case 'PENDING': return '#f59e0b';
      default: return '#6b7280';
    }
  }

  // Legacy methods for backward compatibility
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

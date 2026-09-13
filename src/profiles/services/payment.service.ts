import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { Booking, PaymentStatus as BookingPaymentStatus } from '../entities/booking.entity';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly chapaSecretKey: string;
  private readonly chapaBaseUrl: string;
  private readonly chapaWebhookSecret: string;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly configService: ConfigService,
  ) {
    this.chapaSecretKey = this.configService.get<string>('CHAPA_SECRET_KEY', '');
    this.chapaBaseUrl = this.configService.get<string>('CHAPA_BASE_URL', 'https://api.chapa.co/v1');
    this.chapaWebhookSecret = this.configService.get<string>('CHAPA_WEBHOOK_SECRET', '');
  }

  async initiatePayment(bookingId: string, userId: string): Promise<{ checkoutUrl: string; txRef: string }> {
    // Verify booking exists and belongs to user
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, customerId: userId },
      relations: ['customer', 'business'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or does not belong to user');
    }

    // Check if payment already exists for this booking
    const existingPayment = await this.paymentRepository.findOne({
      where: { bookingId },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Payment already completed for this booking');
    }

    // Generate unique transaction reference
    const txRef = `yf_${bookingId}_${Date.now()}`;

    // Calculate amount (for now, using a fixed service fee)
    const amount = 100; // 100 ETB - this should come from booking or service pricing

    try {
      // Initialize payment with Chapa
      const chapaResponse = await this.callChapaAPI('/transaction/initialize', {
        amount,
        currency: 'ETB',
        email: booking.customer.email,
        first_name: booking.customer.firstName,
        last_name: booking.customer.lastName,
        phone_number: booking.customer.phoneNumber || '0912345678',
        tx_ref: txRef,
        callback_url: `${this.configService.get('FRONTEND_ORIGIN')}/api/v1/payments/webhook`,
        return_url: `${this.configService.get('FRONTEND_ORIGIN')}/payment-success`,
        customization: {
          title: `Payment for ${booking.business.businessName}`,
          description: `Booking payment for appointment on ${new Date(booking.appointmentTime).toLocaleDateString()}`,
        },
      });

      // Save payment record as PENDING
      const payment = this.paymentRepository.create({
        bookingId,
        txRef,
        amount,
        currency: 'ETB',
        status: PaymentStatus.PENDING,
        chapaResponse,
      });

      await this.paymentRepository.save(payment);

      this.logger.log(`Payment initiated for booking ${bookingId}, txRef: ${txRef}`);

      return {
        checkoutUrl: chapaResponse.data.checkout_url,
        txRef,
      };
    } catch (error) {
      this.logger.error(`Failed to initiate payment: ${error.message}`);
      throw new BadRequestException('Failed to initiate payment');
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(JSON.stringify(payload), signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { tx_ref, status, amount } = payload;

    if (!tx_ref) {
      this.logger.warn('Webhook received without tx_ref');
      return;
    }

    const payment = await this.paymentRepository.findOne({
      where: { txRef: tx_ref },
      relations: ['booking'],
    });

    if (!payment) {
      this.logger.warn(`Payment not found for tx_ref: ${tx_ref}`);
      return;
    }

    // Update payment status based on webhook
    let newStatus: PaymentStatus;
    switch (status.toLowerCase()) {
      case 'success':
      case 'paid':
        newStatus = PaymentStatus.PAID;
        break;
      case 'failed':
        newStatus = PaymentStatus.FAILED;
        break;
      default:
        newStatus = PaymentStatus.PENDING;
    }

    payment.status = newStatus;
    payment.chapaResponse = { ...payment.chapaResponse, webhook: payload };
    await this.paymentRepository.save(payment);

    // Update booking payment status if payment is successful
    if (newStatus === PaymentStatus.PAID && payment.booking) {
      payment.booking.paymentStatus = BookingPaymentStatus.PAID;
      await this.bookingRepository.save(payment.booking);
    }

    this.logger.log(`Payment ${tx_ref} updated to status: ${newStatus}`);
  }

  async verifyPayment(txRef: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { txRef },
      relations: ['booking'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    try {
      // Call Chapa verification endpoint
      const verificationResponse = await this.callChapaAPI(`/transaction/verify/${txRef}`, null, 'GET');

      // Update payment status based on verification
      let newStatus: PaymentStatus;
      switch (verificationResponse.status.toLowerCase()) {
        case 'success':
        case 'paid':
          newStatus = PaymentStatus.PAID;
          break;
        case 'failed':
          newStatus = PaymentStatus.FAILED;
          break;
        default:
          newStatus = PaymentStatus.PENDING;
      }

      if (payment.status !== newStatus) {
        payment.status = newStatus;
        payment.chapaResponse = { ...payment.chapaResponse, verification: verificationResponse };
        await this.paymentRepository.save(payment);

        // Update booking payment status if payment is successful
        if (newStatus === PaymentStatus.PAID && payment.booking) {
          payment.booking.paymentStatus = BookingPaymentStatus.PAID;
          await this.bookingRepository.save(payment.booking);
        }

        this.logger.log(`Payment ${txRef} verified and updated to status: ${newStatus}`);
      }

      return payment;
    } catch (error) {
      this.logger.error(`Failed to verify payment ${txRef}: ${error.message}`);
      throw new BadRequestException('Failed to verify payment');
    }
  }

  private async callChapaAPI(endpoint: string, data?: any, method: string = 'POST'): Promise<any> {
    const url = `${this.chapaBaseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.chapaSecretKey}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chapa API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  private verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.chapaWebhookSecret) {
      this.logger.warn('Webhook secret not configured, skipping signature verification');
      return true; // In development, allow unsigned webhooks
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.chapaWebhookSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  async refundPayment(txRef: string, userId: string): Promise<{ message: string; refundStatus: string }> {
    const payment = await this.paymentRepository.findOne({
      where: { txRef },
      relations: ['booking', 'booking.customer'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify the payment belongs to the user making the refund request
    if (payment.booking.customerId !== userId) {
      throw new BadRequestException('You can only refund your own payments');
    }

    // Verify payment is eligible for refund
    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Only paid transactions can be refunded');
    }

    // Check if already refunded
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Payment has already been refunded');
    }

    try {
      // Note: Chapa's refund API is not well documented.
      // This is a placeholder for the actual implementation.
      // In production, you would call Chapa's refund endpoint if available,
      // or process refunds manually via the Chapa dashboard.
      
      this.logger.log(`Refund requested for payment ${txRef}. Processing manually via Chapa dashboard.`);

      // Update payment status to REFUNDED
      payment.status = PaymentStatus.REFUNDED;
      payment.chapaResponse = {
        ...payment.chapaResponse,
        refund: {
          requestedAt: new Date().toISOString(),
          requestedBy: userId,
          status: 'pending_manual_processing',
        },
      };
      await this.paymentRepository.save(payment);

      // Update booking payment status
      if (payment.booking) {
        payment.booking.paymentStatus = BookingPaymentStatus.REFUNDED;
        await this.bookingRepository.save(payment.booking);
      }

      this.logger.log(`Payment ${txRef} marked for refund`);

      return {
        message: 'Refund request submitted successfully. Refunds are processed manually within 3-5 business days.',
        refundStatus: 'pending',
      };
    } catch (error) {
      this.logger.error(`Failed to process refund for payment ${txRef}: ${error.message}`);
      throw new BadRequestException('Failed to process refund request');
    }
  }
}

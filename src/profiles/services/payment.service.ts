import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payments/payment.entity';
import { MockPaymentGateway } from '../payments/payment-gateway.provider';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly gateway: MockPaymentGateway,
  ) {}

  async initiate({ bookingId, amount, currency, returnUrl }: {
    bookingId: string;
    amount: number;
    currency: string;
    returnUrl?: string;
  }) {
    if (!bookingId) {
      throw new BadRequestException('bookingId is required');
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a positive number');
    }

    if (!currency || currency.trim().length < 3) {
      throw new BadRequestException('currency must be a valid ISO code');
    }

    const gatewayResponse = await this.gateway.initiatePayment({
      bookingId,
      amount,
      currency,
      returnUrl,
    });

    return {
      checkoutUrl: gatewayResponse.checkoutUrl,
      paymentId: gatewayResponse.paymentId,
      status: gatewayResponse.status,
    };
  }

  async getStatus(paymentId: string) {
    const result = await this.gateway.verifyPayment(paymentId);
    return {
      id: result.paymentId,
      status: result.status,
      paidAt: result.paidAt?.toISOString(),
    };
  }

  async refund(paymentId: string) {
    if (!paymentId) {
      throw new BadRequestException('paymentId is required');
    }

    return this.gateway.refundPayment(paymentId);
  }
}

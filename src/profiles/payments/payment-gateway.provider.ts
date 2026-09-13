import { Injectable } from '@nestjs/common';
import { PaymentGateway, PaymentStatus } from './payment-gateway.interface';

@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  async initiatePayment(input: {
    bookingId: string;
    amount: number;
    currency: string;
    returnUrl?: string;
  }): Promise<{ checkoutUrl: string; paymentId: string; status: PaymentStatus }> {
    return {
      checkoutUrl: `https://gateway.example.com/pay?booking=${input.bookingId}`,
      paymentId: `pay_${input.bookingId}`,
      status: 'PENDING',
    };
  }

  async verifyPayment(paymentId: string): Promise<{
    paymentId: string;
    status: PaymentStatus;
    paidAt?: Date;
  }> {
    return {
      paymentId,
      status: 'PENDING',
      paidAt: undefined,
    };
  }

  async handleWebhook(payload: unknown): Promise<void> {
    return;
  }

  async refundPayment(paymentId: string): Promise<{
    paymentId: string;
    status: PaymentStatus;
  }> {
    return {
      paymentId,
      status: 'REFUNDED',
    };
  }
}

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface PaymentGateway {
  initiatePayment(input: {
    bookingId: string;
    amount: number;
    currency: string;
    returnUrl?: string;
  }): Promise<{
    checkoutUrl: string;
    paymentId: string;
    status: PaymentStatus;
  }>;

  verifyPayment(paymentId: string): Promise<{
    paymentId: string;
    status: PaymentStatus;
    paidAt?: Date;
  }>;

  handleWebhook(payload: unknown): Promise<void>;

  refundPayment(paymentId: string): Promise<{
    paymentId: string;
    status: PaymentStatus;
  }>;
}

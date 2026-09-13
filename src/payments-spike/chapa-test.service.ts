import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChapaTestService {
  private readonly logger = new Logger(ChapaTestService.name);
  private readonly chapaSecretKey: string;
  private readonly chapaBaseUrl: string;
  private readonly chapaWebhookSecret: string;

  constructor(private configService: ConfigService) {
    this.chapaSecretKey = this.configService.get<string>('CHAPA_SECRET_KEY', '');
    this.chapaBaseUrl = this.configService.get<string>('CHAPA_BASE_URL', 'https://api.chapa.co/v1');
    this.chapaWebhookSecret = this.configService.get<string>('CHAPA_WEBHOOK_SECRET', '');
  }

  async testChapaIntegration(): Promise<any> {
    try {
      this.logger.log('Testing Chapa integration...');
      
      // Test transaction initialization
      const testTxRef = `test-${Date.now()}`;
      const testAmount = 100; // 100 ETB
      
      const initResponse = await this.initializePayment({
        amount: testAmount,
        currency: 'ETB',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        phone_number: '0912345678',
        tx_ref: testTxRef,
        callback_url: 'http://localhost:8000/api/v1/payments/callback',
        return_url: 'http://localhost:3000/payment-success',
        customization: {
          title: 'YegnaFinder Test Payment',
          description: 'Test payment for Chapa integration'
        }
      });

      this.logger.log(`Chapa initialization response: ${JSON.stringify(initResponse)}`);
      
      return {
        success: true,
        message: 'Chapa integration test completed',
        data: initResponse
      };
    } catch (error) {
      this.logger.error(`Chapa test failed: ${error.message}`);
      return {
        success: false,
        message: 'Chapa integration test failed',
        error: error.message
      };
    }
  }

  private async initializePayment(paymentData: any): Promise<any> {
    const response = await fetch(`${this.chapaBaseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.chapaSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chapa API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async verifyPayment(txRef: string): Promise<any> {
    try {
      const response = await fetch(`${this.chapaBaseUrl}/transaction/verify/${txRef}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.chapaSecretKey}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chapa verification error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Payment verification failed: ${error.message}`);
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implementation for HMAC verification with webhook secret
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.chapaWebhookSecret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }
}
import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChapaTestService } from './chapa-test.service';

@ApiTags('Payment Spike')
@Controller('payments-spike')
export class ChapaTestController {
  constructor(private readonly chapaTestService: ChapaTestService) {}

  @Post('test-chapa')
  @ApiOperation({ summary: 'Test Chapa integration (SPIKE - will be deleted)' })
  @ApiResponse({ status: 200, description: 'Chapa test completed.' })
  async testChapaIntegration() {
    const result = await this.chapaTestService.testChapaIntegration();
    return { data: result };
  }

  @Post('verify-webhook')
  @ApiOperation({ summary: 'Test webhook payload verification (SPIKE)' })
  @ApiResponse({ status: 200, description: 'Webhook verification test.' })
  async testWebhookVerification(@Body() body: any) {
    const payload = JSON.stringify(body);
    const testSignature = 'test-signature'; // In real implementation, this comes from headers
    
    const isValid = this.chapaTestService.verifyWebhookSignature(payload, testSignature);
    
    return {
      data: {
        payload,
        signatureValid: isValid,
        message: 'Webhook verification test completed'
      }
    };
  }
}
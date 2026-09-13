import { Body, Controller, Get, Param, Post, Req, UseGuards, Headers, Logger } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentService } from '../services/payment.service';
import { InitiatePaymentDto } from '../dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate payment for a booking' })
  @ApiResponse({ status: 201, description: 'Payment initiated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid booking or payment data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async initiate(@Body() dto: InitiatePaymentDto, @Req() req) {
    const userId = req.user.id;
    const result = await this.paymentService.initiatePayment(dto.bookingId, userId);
    return { data: result };
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Chapa webhook endpoint for payment status updates' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid webhook payload or signature.' })
  async webhook(
    @Body() payload: any,
    @Headers('x-chapa-signature') signature: string,
  ) {
    try {
      this.logger.log(`Received Chapa webhook: ${JSON.stringify(payload)}`);
      await this.paymentService.handleWebhook(payload, signature);
      return { message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      return { error: 'Webhook processing failed' };
    }
  }

  @Get('verify/:txRef')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment status by transaction reference' })
  @ApiResponse({ status: 200, description: 'Payment verification completed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async verifyPayment(@Param('txRef') txRef: string) {
    const payment = await this.paymentService.verifyPayment(txRef);
    return { data: payment };
  }

  @Post(':txRef/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request a refund for a payment' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully.' })
  @ApiResponse({ status: 400, description: 'Payment cannot be refunded.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async refundPayment(@Param('txRef') txRef: string, @Req() req) {
    const userId = req.user.id;
    const result = await this.paymentService.refundPayment(txRef, userId);
    return { data: result };
  }
}

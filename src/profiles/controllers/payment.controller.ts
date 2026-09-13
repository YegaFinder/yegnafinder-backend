import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaymentService } from '../services/payment.service';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Create a payment initiation record and return a gateway checkout URL' })
  async initiate(@Body() dto: { bookingId: string; amount: number; currency: string; returnUrl?: string }) {
    return this.paymentService.initiate(dto);
  }

  @Get(':paymentId')
  @ApiOperation({ summary: 'Check payment status for an authenticated customer' })
  async getStatus(@Param('paymentId') paymentId: string) {
    return this.paymentService.getStatus(paymentId);
  }

  @Post(':paymentId/refund')
  @ApiOperation({ summary: 'Trigger refund handling for an authorized payment' })
  async refund(@Param('paymentId') paymentId: string) {
    return this.paymentService.refund(paymentId);
  }
}

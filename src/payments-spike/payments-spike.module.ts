import { Module } from '@nestjs/common';
import { ChapaTestService } from './chapa-test.service';
import { ChapaTestController } from './chapa-test.controller';

@Module({
  providers: [ChapaTestService],
  controllers: [ChapaTestController],
  exports: [ChapaTestService],
})
export class PaymentsSpikeModule {}
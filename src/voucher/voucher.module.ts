import { Module } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [VoucherController],
  providers: [VoucherService],
  imports: [NatsModule],
})
export class VoucherModule {}

import { Module } from '@nestjs/common';
import { VoucherModule } from './voucher/voucher.module';

@Module({
  imports: [VoucherModule],
})
export class AppModule {}

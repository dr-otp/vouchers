import { VoucherStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { IsCuid } from 'src/common';

export class UpdateVoucherStatusDto {
  @IsCuid()
  id: string;

  @IsEnum(VoucherStatus)
  status: VoucherStatus;
}

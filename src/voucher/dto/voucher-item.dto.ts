import { Type } from 'class-transformer';
import { IsNotEmpty, IsPositive } from 'class-validator';
import { IsCuid } from 'src/common';

export class VoucherItemDto {
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @IsNotEmpty()
  @IsCuid()
  @Type(() => String)
  productId: string;
}

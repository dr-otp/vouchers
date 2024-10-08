import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { IsCuid } from 'src/common';
import { VoucherItemDto } from './voucher-item.dto';

export class CreateVoucherDto {
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => VoucherItemDto)
  @ValidateNested({ each: true })
  items: VoucherItemDto[];

  @IsCuid()
  @Type(() => String)
  customerId: string;
}

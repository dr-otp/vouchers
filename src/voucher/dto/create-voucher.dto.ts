import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { VoucherItemDto } from './voucher-item.dto';
import { IsCuid } from 'src/common';

export class CreateVoucherDto {
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => VoucherItemDto)
  @ValidateNested({ each: true })
  items: VoucherItemDto[];

  @IsUUID()
  @Type(() => String)
  userId: string;

  @IsCuid()
  @Type(() => String)
  clientId: string;
}

import { PartialType } from '@nestjs/mapped-types';
import { CreateVoucherDto } from './create-voucher.dto';
import { IsCuid } from 'src/common';

export class UpdateVoucherDto extends PartialType(CreateVoucherDto) {
  @IsCuid()
  id: string;
}

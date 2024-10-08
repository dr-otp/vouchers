import { Voucher } from '@prisma/client';
import { Customer, Product, UserSummary } from 'src/common';

export interface VoucherResponse extends Partial<Voucher> {
  createdBy: UserSummary;
  updatedBy: UserSummary;
  deletedBy: UserSummary;
  customer: Customer;
  items: VoucherItemResponse[];
}

export interface VoucherItemResponse {
  id: string;
  quantity: number;
  product: Product;
}

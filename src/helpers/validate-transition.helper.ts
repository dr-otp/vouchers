import { VoucherStatus } from '@prisma/client';

export class ValidateTransitionHelper {
  private static allowedTransitions = {
    [VoucherStatus.CREATED]: [VoucherStatus.RECEIVED, VoucherStatus.REJECTED],
    [VoucherStatus.RECEIVED]: [VoucherStatus.RETURNED_TO_SENDER, VoucherStatus.RETURNED_TO_SUPPLIER],
    [VoucherStatus.REJECTED]: [],
    [VoucherStatus.RETURNED_TO_SENDER]: [],
    [VoucherStatus.RETURNED_TO_SUPPLIER]: [],
    [VoucherStatus.CANCELLED]: [],
  };

  static canTransition(currentStatus: VoucherStatus, newStatus: VoucherStatus): boolean {
    const validNextStatuses = this.allowedTransitions[currentStatus];
    return validNextStatuses.includes(newStatus);
  }
}

import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { isCuid } from '@paralleldrive/cuid2';
import { PaginationDto, User } from 'src/common';
import { CreateVoucherDto, UpdateVoucherStatusDto } from './dto';
import { VoucherService } from './voucher.service';

@Controller()
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @MessagePattern('voucher.health')
  healthCheck() {
    return 'Voucher service is up and running';
  }

  @MessagePattern('voucher.create')
  create(@Payload() createVoucherDto: CreateVoucherDto) {
    return this.voucherService.create(createVoucherDto);
  }

  @MessagePattern('voucher.find.all')
  findAll(@Payload() payload: { pagination: PaginationDto; user: User }) {
    const { pagination, user } = payload;
    return this.voucherService.findAll(pagination, user);
  }

  @MessagePattern('voucher.find.one')
  findOne(@Payload() payload: { id: string; user: User }) {
    const { id, user } = payload;

    if (!isCuid(id))
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Invalid voucher id',
      });

    return this.voucherService.findOne(id, user);
  }

  @MessagePattern('voucher.update.status')
  update(@Payload() payload: { updateDto: UpdateVoucherStatusDto; user: User }) {
    const { updateDto, user } = payload;
    return this.voucherService.updateStatus(updateDto, user);
  }

  @MessagePattern('voucher.remove')
  remove(@Payload() payload: { id: string; user: User }) {
    const { id, user } = payload;

    if (!isCuid(id))
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Invalid voucher id',
      });

    return this.voucherService.remove(id, user);
  }
}

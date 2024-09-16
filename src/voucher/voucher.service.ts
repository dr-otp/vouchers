import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaClient, Voucher, VoucherStatus } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { ListResponse, PaginationDto, Role, User } from 'src/common';
import { NATS_SERVICE } from 'src/config';
import { hasRoles, ObjectManipulator, ValidateTransitionHelper } from 'src/helpers';
import { CreateVoucherDto, UpdateVoucherStatusDto } from './dto';

@Injectable()
export class VoucherService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(VoucherService.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database \\(^.^)/');
  }

  create(createVoucherDto: CreateVoucherDto) {
    try {
      const { items, userId } = createVoucherDto;

      return this.voucher.create({
        data: {
          log: { create: { description: 'Voucher created', userId } },
          items: { createMany: { data: items } },
          status: VoucherStatus.CREATED,
          userId,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create voucher',
      });
    }
  }

  async findAll(pagination: PaginationDto, user: User): Promise<ListResponse<Voucher>> {
    const { page, limit } = pagination;
    const isAdmin = hasRoles(user.roles, [Role.Admin]);

    const where = isAdmin ? {} : { deletedAt: null };
    const total = await this.voucher.count({ where });
    const lastPage = Math.ceil(total / limit);

    const data = await this.voucher.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where,
      orderBy: { createdAt: 'desc' },
    });

    const computedData = await this.getUsers(data);

    return { meta: { total, page, lastPage }, data: computedData };
  }

  async findOne(id: string, user: User): Promise<Partial<Voucher>> {
    const isAdmin = hasRoles(user.roles, [Role.Admin]);

    const where = isAdmin ? {} : { deletedAt: null };
    const voucher = await this.voucher.findUnique({
      where: { id, ...where },
    });

    if (!voucher)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `User with id ${id} not found`,
      });

    const [computedVoucher] = await this.getUsers([voucher]);

    return computedVoucher;
  }

  async updateStatus(updateDto: UpdateVoucherStatusDto, user: User): Promise<Partial<Voucher>> {
    try {
      const { id, status: newStatus } = updateDto;
      const voucher = await this.findOne(id, user);
      const currentStatus = voucher.status;

      if (!ValidateTransitionHelper.canTransition(voucher.status, newStatus))
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Cannot transition from ${currentStatus} to ${newStatus}`,
        });

      const description = `Voucher status changed from ${currentStatus} to ${newStatus}`;
      await this.createHistory(voucher, description, user.id);

      const updateData = await this.voucher.update({ where: { id }, data: { status: newStatus } });

      const [computedData] = await this.getUsers([updateData]);

      return computedData;
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update voucher status',
      });
    }
  }

  async remove(id: string, user: User) {
    try {
      const voucher = await this.findOne(id, user);

      await this.createHistory(voucher, 'Voucher deleted', user.id);

      return this.voucher.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete voucher',
      });
    }
  }

  private async createHistory(voucher: Partial<Voucher>, description: string, userId: string) {
    const { id, ...data } = voucher;

    await this.voucherLog.create({
      data: { ...data, voucherId: id, description, userId },
    });
  }

  private async getUsers(vouchers: Partial<Voucher>[]): Promise<Partial<Voucher>[]> {
    // Extract all unique createdById and lastUpdatedById values
    const userIds = new Set<string>();
    vouchers.forEach((v) => {
      if (v.userId) userIds.add(v.userId);
    });

    // Fetch user data for all unique IDs
    const userRequests = Array.from(userIds).map((id) => firstValueFrom(this.client.send('users.find.summary', { id })));
    const users = await Promise.all(userRequests);
    const userMap = new Map(users.map((user) => [user.id, user]));

    const data = vouchers.map((v) => ({
      ...v,
      creator: userMap.get(v.userId),
    }));

    return data.map((d) => ObjectManipulator.exclude(d, ['userId']));
  }
}

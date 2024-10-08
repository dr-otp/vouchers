import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaClient, Voucher, VoucherItem, VoucherStatus } from '@prisma/client';
import { firstValueFrom } from 'rxjs';

import { ApiResponse, Customer, ListResponse, PaginationDto, Product, Role, User, UserSummary } from 'src/common';
import { NATS_SERVICE } from 'src/config';
import { fetchRelatedData, hasRoles, ValidateTransitionHelper } from 'src/helpers';
import { CreateVoucherDto, UpdateVoucherStatusDto, VoucherItemDto } from './dto';
import { VoucherItemResponse, VoucherResponse } from './interfaces/voucher.interface';

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

  async create(createVoucherDto: CreateVoucherDto, user: User): Promise<ApiResponse> {
    try {
      const { items, customerId } = createVoucherDto;

      await Promise.all([this.validateCustomer(customerId, user), this.validateProducts(items)]);
      const data = await this.voucher.create({
        data: {
          log: { create: { description: `Voucher created by ${user.username}`, userId: user.id } },
          items: { createMany: { data: items } },
          status: VoucherStatus.CREATED,
          createdById: user.id,
          customerId,
        },
      });

      return { message: 'Voucher created', status: HttpStatus.CREATED, id: data.id };
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

    const computedData = await this.getRelatedData(data);

    return { meta: { total, page, lastPage }, data: computedData };
  }

  async findOne(id: string, user: User): Promise<VoucherResponse> {
    const isAdmin = hasRoles(user.roles, [Role.Admin]);

    const where = isAdmin ? {} : { deletedAt: null };
    const voucher = await this.voucher.findUnique({
      where: { id, ...where },
      include: { items: { select: { id: true, productId: true, quantity: true } } },
    });

    if (!voucher) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: `Voucher with id ${id} not found` });

    // Parallel data fetching
    const [[computedData], itemsWithProducts] = await Promise.all([this.getRelatedData([voucher]), this.getProducts(voucher.items)]);

    return {
      ...computedData,
      items: itemsWithProducts,
    };
  }

  async receiveVoucher(id: string, user: User): Promise<ApiResponse> {
    try {
      const voucher = await this.findOne(id, user);
      const currentStatus = voucher.status;

      if (currentStatus !== VoucherStatus.CREATED)
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Cannot receive voucher with status ${currentStatus}`,
        });

      const description = `Voucher status changed from ${currentStatus} to ${VoucherStatus.RECEIVED}`;

      await Promise.all([
        this.createHistory(voucher, description, user.id),
        this.voucher.update({ where: { id }, data: { status: VoucherStatus.RECEIVED } }),
      ]);

      return { message: 'Voucher received', status: HttpStatus.OK };
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to receive voucher',
      });
    }
  }

  async updateStatus(updateDto: UpdateVoucherStatusDto, user: User): Promise<ApiResponse> {
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

      await Promise.all([
        await this.createHistory(voucher, description, user.id),
        await this.voucher.update({ where: { id }, data: { status: newStatus } }),
      ]);

      return { message: 'Voucher status updated', status: HttpStatus.OK };
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update voucher status',
      });
    }
  }

  async remove(id: string, user: User): Promise<ApiResponse> {
    try {
      const voucher = await this.findOne(id, user);

      await this.createHistory(voucher, 'Voucher deleted', user.id);

      await this.voucher.update({ where: { id }, data: { deletedAt: new Date() } });

      return { message: 'Voucher deleted', status: HttpStatus.OK };
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

  private async getRelatedData(vouchers: Voucher[]) {
    const usersIds = Array.from(
      new Set(vouchers.flatMap(({ createdById, updatedById, deletedById }) => [createdById, updatedById, deletedById])),
    ).filter((id): id is string => !!id);
    const customersIds = Array.from(new Set(vouchers.flatMap(({ customerId }) => customerId))).filter((id): id is string => !!id);

    const [userMap, customerMap] = await Promise.all([
      fetchRelatedData<UserSummary>({
        ids: usersIds,
        msgPattern: 'users.find.summary.batch',
        errorContext: this.getRelatedData.name,
        logger: this.logger,
        client: this.client,
      }),
      fetchRelatedData<Customer>({
        ids: customersIds,
        msgPattern: 'customer.find.many.summary',
        errorContext: this.getRelatedData.name,
        logger: this.logger,
        client: this.client,
      }),
    ]);

    return vouchers.map(({ createdById, updatedById, deletedById, customerId, ...rest }) => ({
      ...rest,
      createdBy: createdById ? userMap.get(createdById) : null,
      updatedBy: updatedById ? userMap.get(updatedById) : null,
      deletedBy: deletedById ? userMap.get(deletedById) : null,
      customer: customerId ? customerMap.get(customerId) : null,
    }));
  }

  private async getProducts(items: Partial<VoucherItem>[]): Promise<VoucherItemResponse[]> {
    const ids = [...new Set(items.map((item) => item.productId))].filter((id): id is string => !!id);

    const productMap = await fetchRelatedData<Product>({
      ids,
      msgPattern: 'product.validate',
      errorContext: this.getProducts.name,
      logger: this.logger,
      client: this.client,
    });

    return items.map(({ id, productId, quantity }) => ({
      id,
      quantity,
      product: productId ? productMap.get(productId) : null,
    }));
  }

  private async validateCustomer(id: string, user: User): Promise<void> {
    try {
      const customer = await firstValueFrom(this.client.send<{ id: string }>('customer.find.one.summary', { id, user }));

      if (!customer) {
        throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: `Customer with id ${id} not found` });
      }
    } catch (error) {
      this.logger.error(`Failed to validate customer with id ${id}`, error);
      throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to validate customer' });
    }
  }

  private async validateProducts(items: VoucherItemDto[]): Promise<Product[]> {
    const ids = Array.from(new Set(items.map((item) => item.productId)));

    try {
      const products = await firstValueFrom(this.client.send<Product[]>('product.validate', { ids }));

      if (products.length !== ids.length) throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'Some product IDs are invalid' });

      return products;
    } catch (error) {
      this.logger.error('Error during product validation', error);

      if (error.response?.status === HttpStatus.NOT_FOUND)
        throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'Invalid product IDs provided' });

      throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Product validation failed' });
    }
  }
}

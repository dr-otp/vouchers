import { HttpStatus } from '@nestjs/common';

export interface ListResponse<T> {
  meta: ListResponseMeta;
  data: Partial<T>[];
}

export interface ListResponseMeta {
  total: number;
  page: number;
  lastPage: number;
}

export interface ApiResponse {
  status: HttpStatus;
  message: string;
  id?: string;
}

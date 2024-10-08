import { Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

interface FetchRelatedDataParams {
  ids: string[];
  msgPattern: string;
  errorContext: string;
  logger: Logger;
  client: ClientProxy;
}

export const fetchRelatedData = async <T extends { id: string }>({
  ids,
  msgPattern: microserviceMethod,
  errorContext,
  logger,
  client,
}: FetchRelatedDataParams): Promise<Map<string, T>> => {
  if (ids.length === 0) return Promise.resolve(new Map());

  let entities: T[];

  try {
    entities = await firstValueFrom(client.send<T[]>(microserviceMethod, { ids }));
  } catch (error) {
    logger.error(`Error fetching ${errorContext}:`, error);
    throw error;
  }

  return new Map(entities.map((entity) => [entity.id, entity]));
};

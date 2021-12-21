import { Injectable } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';
import { AppConfigService } from 'src/config/config.service';
import { getSdk } from './hasura-sdk';

@Injectable()
export class HasuraService {
  private client;

  constructor(private config: AppConfigService) {
    this.client = new GraphQLClient(config.hasura.apiEndpoint, {
      headers: {
        [`x-hasura-admin-secret`]: config.hasura.adminSecret,
      },
    });
  }

  async findOpenOrders() {
    return getSdk(this.client).findOpenOrders();
  }

  async updateOrder(order) {
    const { id, checkedAt, status, offerId } = order;
    const variables = { id, checkedAt, status, offerId };
    return getSdk(this.client).updateOrder(variables);
  }

  async updateOffer(offer) {
    const {
      id,
      apiKeyId,
      baseAmount,
      confirmedAt,
      createdAt,
      efPrice,
      expiresAt,
      offerId,
      quoteAmount,
    } = offer;
    const variables = {
      id,
      apiKeyId,
      baseAmount,
      confirmedAt,
      createdAt,
      efPrice,
      expiresAt,
      offerId,
      quoteAmount,
    };
    return getSdk(this.client).updateOffer(variables);
  }

  async createOffer(offer) {
    return getSdk(this.client).createOffer({
      input: offer,
    });
  }
}

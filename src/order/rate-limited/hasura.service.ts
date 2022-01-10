import { Injectable } from '@nestjs/common';
import Bottleneck from 'bottleneck';
import { AppConfigService } from 'src/config/config.service';
import { HasuraService } from 'src/shared/hasura/hasura.service';
import { AppLoggerService } from 'src/shared/logger/logger.service';

@Injectable()
export class RateLimitedHasuraService {
  private limiter: Bottleneck;

  constructor(
    private config: AppConfigService,
    private logger: AppLoggerService,
    private hasura: HasuraService,
  ) {
    this.init();
  }

  init() {
    this.setRateLimiter();
    this.logger.log(`Rate limited Hasura service initialized`);
  }

  private setRateLimiter() {
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: this.config.hasura.minInterval,
    });
    this.limiter.on('error', function (error) {
      console.error(error);
    });
  }

  async findOpenOrders() {
    const orders = await this.limiter.schedule(() => this.hasura.findOpenOrders());
    return orders.biscoint_order;
  }

  updateOrder(order) {
    return this.limiter.schedule(() => this.hasura.updateOrder(order));
  }

  updateOffer(offer) {
    return this.limiter.schedule(() => this.hasura.updateOffer(offer));
  }

  async createOffer(offer) {
    const _offer = await this.limiter.schedule(() => this.hasura.createOffer(offer));
    return _offer.insert_biscoint_offer_one.id;
  }
}

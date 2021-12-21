import { Injectable } from '@nestjs/common';
import Bottleneck from 'bottleneck';
import { HasuraService } from 'src/shared/hasura/hasura.service';
import { AppLoggerService } from 'src/shared/logger/logger.service';

@Injectable()
export class RateLimitedHasuraService {
  private limiter: Bottleneck;

  constructor(private logger: AppLoggerService, private hasura: HasuraService) {
    this.init();
  }

  init() {
    this.setRateLimiter();
    this.logger.log(`Rate limited Hasura service initialized`);
  }

  private setRateLimiter() {
    try {
      this.limiter = new Bottleneck({
        maxConcurrent: 1,
        minTime: 60000 / 60,
      });
      this.limiter.on('error', function (error) {
        this.logger.error(error);
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  async findOpenOrders() {
    return (await this.limiter.schedule(() => this.hasura.findOpenOrders()))
      .biscoint_order;
  }

  updateOrder(order) {
    return this.limiter.schedule(() => this.hasura.updateOrder(order));
  }

  updateOffer(offer) {
    return this.limiter.schedule(() => this.hasura.updateOffer(offer));
  }

  async createOffer(offer) {
    const created = await this.limiter.schedule(() =>
      this.hasura.createOffer(offer),
    );
    return created.insert_biscoint_offer_one.id;
  }
}

import { Injectable } from '@nestjs/common';
import {
  IMetaResult,
  IOfferParams,
  IPaginatedTradesResult,
} from 'biscoint-api-node/dist/typings/biscoint';
import Bottleneck from 'bottleneck';
import { BiscointService } from 'src/shared/biscoint/biscoint.service';
import { AppLoggerService } from 'src/shared/logger/logger.service';

@Injectable()
export class RateLimitedBiscointService {
  private offerLimiter: Bottleneck;
  private tradesLimiter: Bottleneck;

  constructor(
    private logger: AppLoggerService,
    private biscoint: BiscointService,
  ) {}

  async init() {
    const meta = await this.biscoint.meta();
    this.setTradesLimiter(meta);
    this.setOfferLimiter(meta);
    this.logger.log(`Rate limited Biscoint service initialized`);
  }

  private setTradesLimiter(meta: IMetaResult) {
    try {
      const { windowMs, maxRequests } = meta.endpoints.trades.post.rateLimit;
      this.tradesLimiter = new Bottleneck({
        maxConcurrent: 1,
        minTime: windowMs / maxRequests,
      });
      this.tradesLimiter.on('error', function (error) {
        this.logger.error(error);
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  private setOfferLimiter(meta: IMetaResult) {
    try {
      const { windowMs, maxRequests } = meta.endpoints.offer.post.rateLimit;
      this.offerLimiter = new Bottleneck({
        maxConcurrent: 1,
        minTime: windowMs / maxRequests,
      });
      this.offerLimiter.on('error', function (error) {
        this.logger.error(error);
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  async getTrades(n: number) {
    try {
      const length = 20;
      const pages = Math.ceil(n / length);

      const trades = [];
      for (let i = 0; i < pages; i++) {
        const t = (await this.tradesLimiter.schedule(() =>
          this.biscoint.trades({
            page: i,
            length: length,
          }),
        )) as IPaginatedTradesResult;
        trades.push(...t.trades);
      }

      return trades;
    } catch (e) {
      this.logger.error(e);
    }
  }

  async getOffer(args: IOfferParams) {
    try {
      return this.offerLimiter.schedule(() => this.biscoint.offer(args));
    } catch (e) {
      this.logger.error(e);
    }
  }
}

import { Injectable } from '@nestjs/common';
import { ITradesResult, OP } from 'biscoint-api-node/dist/typings/biscoint';
import * as _ from 'lodash';
import {
  RABBITMQ_BISCOINT_CONFIRM_KEY,
  RABBITMQ_BISCOINT_NOTIFY_KEY,
} from 'src/app-constants';
import { AppConfigService } from 'src/config/config.service';
import { BrokerService } from 'src/shared/broker/broker.service';
import { AppLoggerService } from 'src/shared/logger/logger.service';
import { BackOffPolicy, Retryable } from 'typescript-retry-decorator';
import { RateLimitedBiscointService } from './rate-limited/biscoint.service';
import { RateLimitedHasuraService } from './rate-limited/hasura.service';

const moment = require('moment');

enum TradeEvent {
  ORDER_CLOSED = 'order-closed',
}

@Injectable()
export class OrderService {
  private cycleCount = 0;

  constructor(
    private config: AppConfigService,
    private logger: AppLoggerService,
    private biscoint: RateLimitedBiscointService,
    private broker: BrokerService,
    private hasura: RateLimitedHasuraService,
  ) {}

  async run() {
    try {
      if (this.config.app.enabled) {
        const startedAt = Date.now();

        await this.checkOpenOrders();
        this.cycleCount += 1;

        const finishedAt = Date.now();
        const elapsedMs = finishedAt - startedAt;

        this.logger.log(
          `Order cycle #${this.cycleCount} took ${elapsedMs.toFixed(2)}ms`,
        );

        const waitIntervalMs = Math.max(
          this.config.app.checkInterval - elapsedMs,
          0,
        );
        setTimeout(this.run.bind(this), waitIntervalMs);
      } else setTimeout(this.run.bind(this), 5000);
    } catch (e) {
      this.logger.error(e);
    }
  }

  async checkOpenOrders() {
    try {
      const openOrders = await this.hasura.findOpenOrders();
      if (openOrders.length) {
        const lastTrades = await this.biscoint.getTrades(
          this.config.app.historySize,
        );
        for (const order of openOrders) {
          const trade = order.offer
            ? _.find(
                lastTrades,
                (t: ITradesResult) => t.offerId === order.offer.offerId,
              )
            : undefined;

          if (!trade) {
            const isTimeToFulfil = this.isTimeToFulfil(order);
            if (isTimeToFulfil) await this.fulfillOrder(order);
          } else {
            order.offer.confirmedAt = trade.date;
            this.updateOffer(order.offer);
            order.status = 'closed';
            this.notify(order, TradeEvent.ORDER_CLOSED);
          }

          order.checkedAt = moment.utc();
          this.updateOrder(order);
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  private isTimeToFulfil(order) {
    return order.notBefore
      ? Date.now() >= new Date(order.notBefore).getTime()
      : true;
  }

  private async fulfillOrder(order) {
    try {
      const offer = await this.getOffer(order);
      if (offer) {
        const isPriceGood = this.isPriceGood(order, offer);
        if (isPriceGood) {
          await this.broker.publish(RABBITMQ_BISCOINT_CONFIRM_KEY, {
            offers: [offer],
          });

          const offerId = await this.createOffer(offer);
          order.offerId = offerId;
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  private getOffer(order) {
    try {
      return this.biscoint.getOffer({
        base: order.base,
        amount: order.amount,
        op: order.op as OP,
        isQuote: order.isQuote,
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  private isPriceGood(order, offer) {
    return order.refPrice
      ? order.op === 'buy'
        ? +offer.efPrice <= +order.refPrice
        : +offer.efPrice >= +order.refPrice
      : true;
  }

  @Retryable({
    maxAttempts: 10,
    backOffPolicy: BackOffPolicy.ExponentialBackOffPolicy,
    backOff: 1000,
    exponentialOption: { maxInterval: 5000, multiplier: 2 },
  })
  private createOffer(offer) {
    try {
      return this.hasura.createOffer(offer);
    } catch (e) {
      this.logger.error(e);
    }
  }

  @Retryable({
    maxAttempts: 10,
    backOffPolicy: BackOffPolicy.ExponentialBackOffPolicy,
    backOff: 1000,
    exponentialOption: { maxInterval: 5000, multiplier: 2 },
  })
  private updateOffer(offer) {
    try {
      return this.hasura.updateOffer(offer);
    } catch (e) {
      this.logger.error(e);
    }
  }

  @Retryable({
    maxAttempts: 10,
    backOffPolicy: BackOffPolicy.ExponentialBackOffPolicy,
    backOff: 1000,
    exponentialOption: { maxInterval: 5000, multiplier: 2 },
  })
  private updateOrder(order) {
    try {
      return this.hasura.updateOrder(order);
    } catch (e) {
      this.logger.error(e);
    }
  }

  private notify(order, event: TradeEvent) {
    try {
      this.broker.publish(RABBITMQ_BISCOINT_NOTIFY_KEY, {
        event: event,
        payload: order,
      });
    } catch (e) {
      this.logger.error(e);
    }
  }
}

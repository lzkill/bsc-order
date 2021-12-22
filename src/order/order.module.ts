import { Module } from '@nestjs/common';
import { BiscointModule } from 'src/shared/biscoint/biscoint.module';
import { BrokerModule } from 'src/shared/broker/broker.module';
import { HasuraModule } from 'src/shared/hasura/hasura.module';
import { OrderService } from './order.service';
import { RateLimitedBiscointService } from './rate-limited/biscoint.service';
import { RateLimitedHasuraService } from './rate-limited/hasura.service';
import { TelegramService } from './rate-limited/telegram.service';

@Module({
  imports: [BiscointModule, BrokerModule, HasuraModule],
  providers: [
    OrderService,
    RateLimitedBiscointService,
    RateLimitedHasuraService,
    TelegramService,
  ],
})
export class OrderModule {}

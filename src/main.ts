import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OrderService } from './order/order.service';
import { RateLimitedBiscointService } from './order/rate-limited/biscoint.service';
import { TelegramService } from './order/rate-limited/telegram.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(0);

  const telegram = app.get(TelegramService);
  await telegram.init();

  const biscoint = app.get(RateLimitedBiscointService);
  await biscoint.init();

  const order = app.get(OrderService);
  await order.run();
}

bootstrap();

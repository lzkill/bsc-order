import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from './config/config-helper';
import { AppConfigModule } from './config/config.module';
import { OrderModule } from './order/order.module';
import { AppLoggerModule } from './shared/logger/logger.module';

@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    OrderModule,
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [() => config.createConfig()],
    }),
  ],
})
export class AppModule {}

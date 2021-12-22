import { Injectable } from '@nestjs/common';
import Bottleneck from 'bottleneck';
import { AppConfigService } from 'src/config/config.service';
import { AppLoggerService } from 'src/shared/logger/logger.service';
import { Telegraf } from 'telegraf';
import {
  formatHelpMessage,
  formatPingMessage,
  formatServiceDisabledMessage,
  formatServiceEnabledMessage,
  formatWelcomeMessage,
} from './telegram-messages';

@Injectable()
export class TelegramService {
  private bot: Telegraf;
  private limiter: Bottleneck;

  constructor(
    private config: AppConfigService,
    private logger: AppLoggerService,
  ) {
    if (this.config.telegram.token) {
      this.bot = new Telegraf(this.config.telegram.token);
    }
  }

  async init() {
    this.setRateLimiter();

    if (this.config.telegram.token) {
      this.bot.command('bob_start', async (ctx) => {
        try {
          const message = formatWelcomeMessage();
          await this.sendMessage(message, ctx.chat.id).then(() => {
            return this.sendMessage(formatHelpMessage(), ctx.chat.id);
          });
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bob_enable', async (ctx) => {
        try {
          this.config.app.enabled = true;
          const message = formatServiceEnabledMessage();
          await this.sendMessage(message, ctx.chat.id);
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bob_disable', async (ctx) => {
        try {
          this.config.app.enabled = false;
          const message = formatServiceDisabledMessage();
          await this.sendMessage(message, ctx.chat.id);
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bob_config', async (ctx) => {
        try {
          const message = this.stringify(this.config.app);
          await this.sendMessage(message, ctx.chat.id, false);
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bob_ping', async (ctx) => {
        try {
          const message = formatPingMessage();
          await this.sendMessage(message, ctx.chat.id);
        } catch (e) {
          this.logger.error(e);
        }
      });

      this.bot.command('bob_help', async (ctx) => {
        try {
          const message = formatHelpMessage();
          await this.sendMessage(message, ctx.chat.id);
        } catch (e) {
          this.logger.error(e);
        }
      });

      try {
        this.bot.launch();
        this.logger.log(`Telegram bot launched`);
      } catch (e) {
        this.logger.error(e);
      }
    }
  }

  private setRateLimiter() {
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 5000,
    });
    this.limiter.on('error', function (error) {
      console.error(error);
    });
  }

  sendMessage(message: string, chatId?: any, removeWhiteSpaces = true) {
    if (this.canChat() && this.config.telegram.enabled) {
      let formatted = message.trim();
      if (removeWhiteSpaces) formatted = this.removeWhiteSpaces(formatted);
      return this.limiter.schedule(() =>
        this.bot.telegram.sendMessage(
          chatId ? chatId : this.config.telegram.chatId,
          formatted,
          {
            parse_mode: 'HTML',
          },
        ),
      );
    }
  }

  private canChat() {
    return this.config.telegram.chatId;
  }

  private removeWhiteSpaces(multiline: string) {
    return multiline
      .split(/\r?\n/)
      .map((row) => row.trim().split(/\s+/).join(' '))
      .join('\n');
  }

  private stringify(value: any) {
    return JSON.stringify(value, (k, v) => v ?? undefined, 2);
  }
}

import * as joi from 'joi';

export const positiveIntegerSchema = joi.number().positive().precision(0);

export const appSchema = joi.object({
  name: joi.string().required(),
  checkInterval: positiveIntegerSchema.default(15000),
  historySize: positiveIntegerSchema.default(100),
  enabled: joi.boolean().default(true),
});

export const biscointSchema = joi.object({
  apiKey: joi.string().required(),
  apiSecret: joi.string().required(),
  apiUrl: joi.string().default('https://api.biscoint.io/'),
  apiTimeout: positiveIntegerSchema.default(15000),
});

export const hasuraSchema = joi.object({
  apiEndpoint: joi.string().required(),
  adminSecret: joi.string().required(),
});

export const papertrailSchema = joi.object({
  token: joi.string().empty(''),
  enabled: joi.boolean().default(false),
});

export const rabbitMqSchema = joi.object({
  uri: joi.string().required(),
});

export const telegramSchema = joi.object({
  token: joi.string().empty(''),
  chatId: joi.string().empty(''),
  enabled: joi.boolean().default(false),
});

export interface AppConfig {
  name: string;
  checkInterval: number;
  historySize: number;
  enabled: boolean;
}

export interface BiscointConfig {
  apiKey: string;
  apiSecret: string;
  apiUrl: string;
  apiTimeout: number;
}

export interface HasuraConfig {
  apiEndpoint: string;
  adminSecret: string;
}

export interface PapertrailConfig {
  token: string;
  enabled: boolean;
}

export interface RabbitMqConfig {
  uri: string;
}

export interface TelegramConfig {
  token: string;
  chatId: string;
  enabled: boolean;
}

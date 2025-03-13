// src/telegram/telegram.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramController } from './controllers/telegram.controller';
import { AlertController } from './controllers/alert.controller';
import { BalanceController } from './controllers/balance.controller';
import { RateController } from './controllers/rate.controller';
import { TelegramService } from './telegram.service';
import { Merchant } from './entities/merchant.entity';
import { Balance } from './entities/balance.entity';
import { Telegraf } from 'telegraf';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant, Balance]),
  ],
  controllers: [
    TelegramController,
    BalanceController,
    RateController,
    AlertController,
  ],
  providers: [
    TelegramService,
    {
      provide: 'TELEGRAM_BOT',
      useFactory: () => {
        const bot = new Telegraf('7813419103:AAFsxLnCcB8smdFdgSR3b9bLhniNvoY8UzA'); // Замените на ваш токен
        return bot;
      },
    },
  ],
})
export class TelegramModule {}
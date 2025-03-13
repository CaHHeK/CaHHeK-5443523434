// src/telegram/controllers/rate.controller.ts
import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { TelegramService } from '../telegram.service';

@Controller('rate')
export class RateController implements OnModuleInit {
  constructor(
    @Inject('TELEGRAM_BOT') private readonly bot: Telegraf,
    private readonly telegramService: TelegramService,
  ) {}

  onModuleInit() {
    this.bot.command('rate', async (ctx: Context) => {
      const userId = ctx.from?.id;
      const chatId = ctx.chat?.id;
      if (!chatId || !userId) {
        await ctx.reply('Не удалось определить пользователя или чат.');
        return;
      }

      const text = ctx.message?.['text'] || '';
      const args = text.split(' ').slice(1); // Получаем аргументы после /rate
      const adminIds = this.telegramService.getAdminIds();

      if (adminIds.includes(userId) && args.length > 0) {
        const merchantChatId = args[0];
        console.log(`Admin ${userId} requested rates for merchantChatId: ${merchantChatId}`);
        const rateInfo = await this.telegramService.getExchangeRatesForMerchantChat(merchantChatId);
        await ctx.reply(rateInfo, { parse_mode: 'HTML' });
        return;
      }

      console.log(`Non-admin ${userId} requested rates for chatId: ${chatId}`);
      const rateInfo = await this.telegramService.getExchangeRates(chatId);
      await ctx.reply(rateInfo, { parse_mode: 'HTML' });
    });
  }
}
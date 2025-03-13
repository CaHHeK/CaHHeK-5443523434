// src/telegram/controllers/balance.controller.ts
import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { TelegramService } from '../telegram.service';

@Controller('balance')
export class BalanceController implements OnModuleInit {
  constructor(
    @Inject('TELEGRAM_BOT') private readonly bot: Telegraf,
    private readonly telegramService: TelegramService,
  ) {}

  onModuleInit() {
    this.bot.command('balance', async (ctx: Context) => {
      const userId = ctx.from?.id;
      const chatId = ctx.chat?.id;
      if (!chatId || !userId) {
        await ctx.reply('Не удалось определить пользователя или чат.');
        return;
      }

      const text = ctx.message?.['text'] || '';
      const args = text.split(' ').slice(1); // Получаем аргументы после /balance
      const adminIds = this.telegramService.getAdminIds();

      if (adminIds.includes(userId) && args.length > 0) {
        const merchantChatId = args[0];
        console.log(`Admin ${userId} requested balance for merchantChatId: ${merchantChatId}`);
        const balanceInfo = await this.telegramService.getBalanceForMerchantChat(merchantChatId);
        await ctx.reply(balanceInfo, { parse_mode: 'HTML' });
        return;
      }

      console.log(`Non-admin ${userId} requested balance for chatId: ${chatId}`);
      const balanceInfo = await this.telegramService.getBalance(chatId);
      await ctx.reply(balanceInfo, { parse_mode: 'HTML' });
    });
  }
}
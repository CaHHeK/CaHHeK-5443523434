import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { TelegramService } from '../telegram.service';
import { Telegraf } from 'telegraf';
import { Context } from 'telegraf';

@Controller('balance')
export class BalanceController implements OnModuleInit {
  constructor(
    @Inject('TELEGRAM_BOT') private readonly bot: Telegraf,
    private readonly telegramService: TelegramService,
  ) {}

  onModuleInit() {
    this.bot.command('balance', async (ctx: Context) => {
      if (!ctx.chat) {
        await ctx.reply('This command can only be used in a chat. Please add me to a group.');
        return;
      }

      const chatId = ctx.chat.id;
      const balanceInfo = await this.telegramService.getBalance(chatId);
      await ctx.reply(balanceInfo, { parse_mode: 'HTML' });
    });
  }
}
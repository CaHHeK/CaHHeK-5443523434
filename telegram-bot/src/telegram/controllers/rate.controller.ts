import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { TelegramService } from '../telegram.service';
import { Telegraf } from 'telegraf';
import { Context } from 'telegraf';

@Controller('rate')
export class RateController implements OnModuleInit {
  constructor(
    @Inject('TELEGRAM_BOT') private readonly bot: Telegraf,
    private readonly telegramService: TelegramService,
  ) {}

  onModuleInit() {
    this.bot.command('rate', async (ctx: Context) => {
      if (!ctx.chat) {
        await ctx.reply('This command can only be used in a chat. Please add me to a group.');
        return;
      }

      const chatId = ctx.chat.id;
      const rateInfo = await this.telegramService.getExchangeRates(chatId);
      await ctx.reply(rateInfo, { parse_mode: 'HTML' });
    });
  }
}
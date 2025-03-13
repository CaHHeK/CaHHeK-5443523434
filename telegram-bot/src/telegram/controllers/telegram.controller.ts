import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { TelegramService } from '../telegram.service';

@Controller('telegram')
export class TelegramController implements OnModuleInit {
  constructor(
    @Inject('TELEGRAM_BOT') private readonly bot: Telegraf,
    private readonly telegramService: TelegramService,
  ) {}

  onModuleInit() {
    // Обработка команды /start без клавиатуры
    this.bot.start(async (ctx: Context) => {
      if (!ctx.chat) {
        await ctx.reply('Please add me to a group chat to use this bot.');
        return;
      }
      await ctx.reply(
        'Welcome! I can show you balance or exchange rates. Use the commands from the menu (tap / or the menu button).',
      );
    });

    // Запуск бота
    this.bot.launch().then(() => {
      console.log('Telegram bot launched');
    }).catch((error) => {
      console.error('Failed to launch Telegram bot:', error);
    });
  }
}
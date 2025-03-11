import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { Telegraf } from 'telegraf';
import { Context } from 'telegraf';
import { Markup } from 'telegraf';

@Controller('telegram')
export class TelegramController implements OnModuleInit {
  constructor(
    @Inject('TELEGRAM_BOT') private readonly bot: Telegraf,
    private readonly telegramService: TelegramService,
  ) {}

  onModuleInit() {
    // Определяем клавиатуру с кнопками
    const keyboard = Markup.keyboard([
      ['/balance', '/rate'], // Убедитесь, что здесь нет лишних пробелов или пустых элементов
    ])
      .resize()
      .persistent();

    // Обработка команды /start
    this.bot.start(async (ctx: Context) => {
      if (!ctx.chat) {
        await ctx.reply('Please add me to a group chat to use this bot.');
        return;
      }
      await ctx.reply(
        'Welcome! I can show you balance or exchange rates. Use the buttons below:',
        keyboard,
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
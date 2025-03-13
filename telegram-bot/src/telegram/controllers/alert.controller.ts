import { Controller, Post, Body, HttpException, HttpStatus, Logger, OnModuleInit } from '@nestjs/common';
import { TelegramService } from '../telegram.service';

@Controller('alert')
export class AlertController implements OnModuleInit {
  private readonly logger = new Logger(AlertController.name);

  constructor(private readonly telegramService: TelegramService) {}

  onModuleInit() {
    // Устанавливаем рассылку балансов строго в 0, 6, 12, 18 часов по времени сервера
    this.scheduleBalanceUpdates();
  }

  private scheduleBalanceUpdates() {
    const scheduleNextRun = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const nextScheduledHour = Math.ceil((currentHour + 1) / 6) * 6; // Определяем следующий интервал (0, 6, 12, 18)
      const nextRunDate = new Date(now);
      nextRunDate.setHours(nextScheduledHour, 0, 0, 0); // Устанавливаем время на начало следующего интервала

      // Если текущее время уже после следующего запланированного интервала, переходим к следующему дню
      if (nextRunDate <= now) {
        nextRunDate.setHours(nextRunDate.getHours() + 6);
      }

      const delayUntilNextRun = nextRunDate.getTime() - now.getTime(); // Вычисляем задержку до следующего запуска

      this.logger.log(`Next balance update scheduled at ${nextRunDate.toISOString()}`);

      setTimeout(async () => {
        try {
          await this.telegramService.sendBalanceToAllMerchants();
          this.logger.log('Automatic balance update sent to all merchants');
        } catch (error) {
          this.logger.error(`Failed to send automatic balance update: ${error.message}`);
        }

        // После выполнения задачи планируем следующий запуск
        scheduleNextRun();
      }, delayUntilNextRun);
    };

    // Запускаем первый раз
    scheduleNextRun();
  }

  @Post('down-time')
  async sendAlert(@Body() body: { message: string }) {
    this.logger.log(`Received message: ${body.message}`);
    if (!body.message || typeof body.message !== 'string' || body.message.trim() === '') {
      throw new HttpException('Message is required and must be a non-empty string', HttpStatus.BAD_REQUEST);
    }

    const utf8Message = Buffer.from(body.message, 'utf-8').toString('utf-8');
    this.logger.log(`UTF-8 converted message: ${utf8Message}`);

    try {
      await this.telegramService.sendAlertToAllChats(utf8Message);
      return { status: 'success', message: 'Alert sent to all chats' };
    } catch (error) {
      throw new HttpException(`Failed to send alert: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
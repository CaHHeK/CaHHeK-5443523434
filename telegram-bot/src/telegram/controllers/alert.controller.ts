// src/telegram/controllers/alert.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus, Logger, OnModuleInit } from '@nestjs/common';
import { TelegramService } from '../telegram.service';

@Controller('alert')
export class AlertController implements OnModuleInit {
  private readonly logger = new Logger(AlertController.name);

  constructor(private readonly telegramService: TelegramService) {}

  onModuleInit() {
    this.scheduleBalanceUpdates();
  }

  private scheduleBalanceUpdates() {
    const scheduleNextRun = () => {
      const now = new Date();
      const currentUTCHour = now.getUTCHours(); // Часы в UTC
      const targetHours = [0, 6, 12, 18];
      
      // Находим следующий интервал UTC
      let nextHour = targetHours.find(hour => hour > currentUTCHour) || targetHours[0];
      const nextRunDate = new Date(now);
      nextRunDate.setUTCHours(nextHour, 0, 0, 0); // Устанавливаем время в UTC

      // Если следующий интервал уже прошёл или сейчас, добавляем 6 часов
      if (nextRunDate <= now) {
        nextRunDate.setUTCHours(nextRunDate.getUTCHours() + 6);
      }

      const delayUntilNextRun = nextRunDate.getTime() - now.getTime();
      this.logger.log(`Next balance update scheduled at ${nextRunDate.toISOString()}`);

      setTimeout(async () => {
        try {
          await this.telegramService.sendBalanceToAllMerchants();
          this.logger.log('Automatic balance update sent to all merchants');
        } catch (error) {
          this.logger.error(`Failed to send automatic balance update: ${error.message}`);
        }

        // Планируем следующий запуск
        scheduleNextRun();
      }, delayUntilNextRun);
    };

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
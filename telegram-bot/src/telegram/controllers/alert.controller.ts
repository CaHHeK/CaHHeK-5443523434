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
      const currentUTCHour = now.getUTCHours();
      const currentUTCMinutes = now.getUTCMinutes();
      const currentUTCSeconds = now.getUTCSeconds();
      const targetHours = [0, 6, 12, 18];

      // Находим следующий интервал
      let nextHour = targetHours.find(hour => hour > currentUTCHour) || targetHours[0];
      const nextRunDate = new Date(now);
      nextRunDate.setUTCHours(nextHour, 0, 0, 0);

      // Если следующий интервал уже прошёл или сейчас, переходим к следующему дню
      if (nextRunDate <= now) {
        nextRunDate.setUTCDate(nextRunDate.getUTCDate() + 1);
        nextRunDate.setUTCHours(targetHours[0], 0, 0, 0); // Устанавливаем 0:00 следующего дня
      }

      const delayUntilNextRun = nextRunDate.getTime() - now.getTime();
      this.logger.log(`Next balance update scheduled at ${nextRunDate.toISOString()} (delay: ${delayUntilNextRun}ms)`);

      if (delayUntilNextRun <= 0) {
        this.logger.error('Delay is zero or negative, skipping to avoid infinite loop');
        setTimeout(scheduleNextRun, 1000); // Ждём 1 секунду перед повторной попыткой
        return;
      }

      setTimeout(async () => {
        try {
          await this.telegramService.sendBalanceToAllMerchants();
          this.logger.log('Automatic balance update sent to all merchants');
        } catch (error) {
          this.logger.error(`Failed to send automatic balance update: ${error.message}`);
        }
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
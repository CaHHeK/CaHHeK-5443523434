import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { TelegramService } from '../telegram.service';

@Controller('alert')
export class AlertController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('down-time')
  async sendAlert(@Body() body: { message: string }) {
    if (!body.message || typeof body.message !== 'string' || body.message.trim() === '') {
      throw new HttpException('Message is required and must be a non-empty string', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.telegramService.sendAlertToAllChats(body.message);
      return { status: 'success', message: 'Alert sent to all chats' };
    } catch (error) {
      throw new HttpException(`Failed to send alert: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
// src/telegram/telegram.service.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from './entities/merchant.entity';
import { Balance } from './entities/balance.entity';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly adminIds = [494492744, 440941739, 6487820315];

  constructor(
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(Balance)
    private balanceRepository: Repository<Balance>,
    @Inject('TELEGRAM_BOT') private readonly bot: Telegraf,
  ) {}

  async getBalance(chatId: number): Promise<string> {
    const merchant = await this.merchantRepository.findOne({
      where: { chat_id: chatId.toString() },
      relations: ['balances'],
    });

    if (!merchant) {
      this.logger.warn(`Merchant not found for chatId: ${chatId}`);
      return 'Merchant not found';
    }

    return this.formatBalanceResponse(merchant);
  }

  async getExchangeRates(chatId: number): Promise<string> {
    const merchant = await this.merchantRepository.findOne({
      where: { chat_id: chatId.toString() },
      relations: ['balances'],
    });

    if (!merchant) {
      this.logger.warn(`Merchant not found for chatId: ${chatId}`);
      return 'Merchant not found';
    }

    return this.formatRateResponse(merchant);
  }

  async getBalanceForMerchantChat(chatId: string): Promise<string> {
    const merchant = await this.merchantRepository.findOne({
      where: { chat_id: chatId },
      relations: ['balances'],
    });

    if (!merchant) {
      this.logger.warn(`Merchant not found for chatId: ${chatId}`);
      return 'Merchant not found';
    }

    return this.formatBalanceResponse(merchant);
  }

  async getExchangeRatesForMerchantChat(chatId: string): Promise<string> {
    const merchant = await this.merchantRepository.findOne({
      where: { chat_id: chatId },
      relations: ['balances'],
    });

    if (!merchant) {
      this.logger.warn(`Merchant not found for chatId: ${chatId}`);
      return 'Merchant not found';
    }

    return this.formatRateResponse(merchant);
  }

  async sendAlertToAllChats(message: string): Promise<void> {
    this.logger.log('Sending alert to all merchant chats');
    const merchants = await this.merchantRepository.find();
    if (!merchants.length) {
      this.logger.warn('No merchants found in the database');
      return;
    }

    for (const merchant of merchants) {
      try {
        await this.bot.telegram.sendMessage(merchant.chat_id, message, { parse_mode: 'HTML' });
        this.logger.log(`Alert sent to chat ${merchant.chat_id}`);
      } catch (error) {
        this.logger.error(`Failed to send alert to chat ${merchant.chat_id}: ${error.message}`);
      }
    }
  }

  // src/telegram/telegram.service.ts (фрагмент)
async sendBalanceToAllMerchants(): Promise<void> {
  this.logger.log('Sending balance to all merchant chats');
  const merchants = await this.merchantRepository.find({ relations: ['balances'] });

  for (const merchant of merchants) {
    let retries = 3; // Максимум 3 попытки
    while (retries > 0) {
      try {
        const balanceInfo = this.formatBalanceResponse(merchant);
        await this.bot.telegram.sendMessage(merchant.chat_id, balanceInfo, { parse_mode: 'HTML' });
        this.logger.log(`Balance sent to chat ${merchant.chat_id}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка 1 секунда между сообщениями
        break; // Успешно отправлено, выходим из цикла
      } catch (error) {
        if (error.code === 429) { // Ошибка "Too Many Requests"
          const retryAfter = error.parameters?.retry_after || 35; // Время ожидания из ответа Telegram
          this.logger.warn(`Too Many Requests for chat ${merchant.chat_id}, retrying after ${retryAfter}s`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          retries--;
        } else {
          this.logger.error(`Failed to send balance to chat ${merchant.chat_id}: ${error.message}`);
          break; // Другая ошибка, прекращаем попытки
        }
      }
    }
    if (retries === 0) {
      this.logger.error(`Failed to send balance to chat ${merchant.chat_id} after retries`);
    }
  }
}

  private formatBalanceResponse(merchant: Merchant): string {
    const date = new Date().toISOString().replace('T', ' ').substr(0, 19) + 'Z';
    let response = `<b>Date:</b> ${date}\n\n`;

    merchant.balances.forEach((balance) => {
      response += `<b>Origin:</b> ${balance.origin}\n`;
      response += `<b>Current balance:</b> ${Number(balance.balance).toFixed(2)}${balance.currency} / ${Number(balance.usd_balance).toFixed(2)}USD\n`;
      response += `<b>Balance limit:</b> ${Number(balance.balance_limit).toFixed(2)}USD\n\n`;
    });

    return response;
  }

  private formatRateResponse(merchant: Merchant): string {
    const date = new Date().toISOString().replace('T', ' ').substr(0, 19) + 'Z';
    let response = `<b>Date:</b> ${date}\n\n`;

    merchant.balances.forEach((balance) => {
      response += `<b>Currency:</b> ${balance.currency} (${balance.origin})\n`;
      response += `<b>Exchange rate:</b> ${Number(balance.exchange_rate).toFixed(2)} ${balance.currency} / 1 USD\n\n`;
    });

    return response;
  }

  getAdminIds(): number[] {
    return this.adminIds;
  }
}
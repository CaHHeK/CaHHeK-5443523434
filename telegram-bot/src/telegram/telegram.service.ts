import { Injectable, Logger, Inject } from '@nestjs/common'; // Добавляем Inject
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from './entities/merchant.entity';
import { Balance } from './entities/balance.entity';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(Balance)
    private balanceRepository: Repository<Balance>,
    @Inject('TELEGRAM_BOT') private readonly bot: Telegraf, // Используем Inject для бота
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

    const date = new Date().toISOString().replace('T', ' ').substr(0, 19) + 'Z';
    let response = `<b>Date:</b> ${date}\n\n`;

    merchant.balances.forEach((balance) => {
      response += `<b>Origin:</b> ${balance.origin}\n`;
      response += `<b>Current balance:</b> ${Number(balance.balance).toFixed(2)}${balance.currency} / ${Number(balance.usd_balance).toFixed(2)}USD\n`;
      response += `<b>Balance limit:</b> ${Number(balance.balance_limit).toFixed(2)}USD\n\n`;
    });

    return response;
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

    const date = new Date().toISOString().replace('T', ' ').substr(0, 19) + 'Z';
    let response = `<b>Date:</b> ${date}\n\n`;

    merchant.balances.forEach((balance) => {
      response += `<b>Currency:</b> ${balance.currency} (${balance.origin})\n`;
      response += `<b>Exchange rate:</b> ${Number(balance.exchange_rate).toFixed(2)} ${balance.currency} / 1 USD\n\n`;
    });

    return response;
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

    this.logger.log('Alert sending completed');
  }
}
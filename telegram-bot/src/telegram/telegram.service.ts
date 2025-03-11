// src/telegram/telegram.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from './entities/merchant.entity';
import { Balance } from './entities/balance.entity';

@Injectable()
export class TelegramService {
  constructor(
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(Balance)
    private balanceRepository: Repository<Balance>,
  ) {}

  async getBalance(chatId: number): Promise<string> {
    const merchant = await this.merchantRepository.findOne({
      where: { chat_id: chatId.toString() },
      relations: ['balances'],
    });

    if (!merchant) {
      return 'Merchant not found';
    }

    const date = new Date().toISOString().replace('T', ' ').substr(0, 19) + 'Z';
    let response = `<b>Date:</b> ${date}\n\n`;

    merchant.balances.forEach((balance) => {
      response += `<b>Origin:</b> ${balance.origin}\n`;
      response += `<b>Current balance:</b> ${balance.balance.toFixed(2)}${balance.currency} / ${balance.usd_balance.toFixed(2)}USD\n`;
      response += `<b>Balance limit:</b> ${balance.balance_limit.toFixed(2)}USD\n\n`;
    });

    return response;
  }

  async getExchangeRates(chatId: number): Promise<string> {
    const merchant = await this.merchantRepository.findOne({
      where: { chat_id: chatId.toString() },
      relations: ['balances'],
    });

    if (!merchant) {
      return 'Merchant not found';
    }

    const date = new Date().toISOString().replace('T', ' ').substr(0, 19) + 'Z';
    let response = `<b>Date:</b> ${date}\n\n`;

    merchant.balances.forEach((balance) => {
      response += `<b>Currency:</b> ${balance.currency} (${balance.origin})\n`;
      response += `<b>Exchange rate:</b> ${balance.exchange_rate.toFixed(2)} ${balance.currency} / 1 USD\n\n`;
    });

    return response;
  }
}
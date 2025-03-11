import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as PDFDocument from 'pdfkit';
import { ReceiptPayload, BankTransactionTypeEnum, BankTransactionOperationTypeEnum, CustomerOriginEnum, CurrencyEnum } from './banks.types';

@Controller('banks')
export class BanksController {
  @Post('generate-receipt')
  public async generateReceipt(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() payload: ReceiptPayload,
  ) {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    // Собираем данные в буфер
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.header('Content-Type', 'application/pdf');
      res.header('Content-Disposition', `attachment; filename=receipt-${payload.id || 'unknown'}.pdf`);
      res.send(pdfData);
    });

    // Заголовок чека
    doc.fontSize(16).text('Bank Transaction Receipt', { align: 'center' });
    doc.moveDown();

    // Основной текст чека
    doc.fontSize(12);

    // Обязательные поля
    if (payload.id !== undefined && payload.id !== null) {
      doc.text(`Transaction ID: ${payload.id}`);
    }
    if (payload.providerTransactionId) {
      doc.text(`Provider Transaction ID: ${payload.providerTransactionId}`);
    }
    if (payload.id !== undefined || payload.providerTransactionId) {
      doc.moveDown(); // Добавляем отступ только если есть хотя бы одно из полей
    }

    // Отправитель
    if (payload.bankAccount) {
      doc.text('From:');
      if (payload.bankAccount.fullName) {
        doc.text(`  Name: ${payload.bankAccount.fullName}`);
      }
      if (payload.bankAccount.props_ARS_CBU) {
        doc.text(`  CBU: ${payload.bankAccount.props_ARS_CBU}`);
      }
      if (payload.bankAccount.props_ARS_CUIT) {
        doc.text(`  CUIT: ${payload.bankAccount.props_ARS_CUIT}`);
      }
      doc.moveDown();
    }

    // Получатель
    doc.text('To:');
    if (payload.fullName) {
      doc.text(`  Name: ${payload.fullName}`);
    }
    if (payload.props_ARS_CBU) {
      doc.text(`  CBU: ${payload.props_ARS_CBU}`);
    }
    if (payload.props_ARS_CUIT) {
      doc.text(`  CUIT: ${payload.props_ARS_CUIT}`);
    }
    if (payload.props_ARS_COELSA_ID) {
      doc.text(`  COELSA ID: ${payload.props_ARS_COELSA_ID}`);
    }
    doc.moveDown();

    // Сумма и валюта
    if (payload.amount) {
      const amount = Math.abs(parseFloat(payload.amount as unknown as string)).toFixed(2);
      if (!isNaN(parseFloat(amount))) { // Проверяем, что amount валидное число
        doc.text(`Amount: ${amount} ${payload.currency === CurrencyEnum.ARS ? 'ARS' : 'Unknown'}`);
      }
    }

    // Типы транзакций
    if (payload.transactionType !== undefined && payload.transactionType in BankTransactionTypeEnum) {
      doc.text(`Transaction Type: ${BankTransactionTypeEnum[payload.transactionType]}`);
    }
    if (payload.operationType !== undefined && payload.operationType in BankTransactionOperationTypeEnum) {
      doc.text(`Operation Type: ${BankTransactionOperationTypeEnum[payload.operationType]}`);
    }

    // Происхождение
    if (payload.origin) {
      doc.text(`Origin: ${payload.origin === CustomerOriginEnum.ARS ? 'Argentina' : 'Unknown'}`);
    }

    // Добавляем отступ перед датой, если есть предыдущие данные
    if (payload.amount || payload.transactionType !== undefined || payload.operationType !== undefined || payload.origin) {
      doc.moveDown();
    }

    // Дата
    if (payload.createdAt !== undefined && !isNaN(payload.createdAt)) {
      const date = new Date(payload.createdAt);
      if (date.toString() !== 'Invalid Date') { // Проверяем, что дата валидна
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'America/Argentina/Buenos_Aires',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        };
        const formattedDate = date.toLocaleString('en-US', options);
        doc.text(`Date: ${formattedDate}`);
      }
    }

    // Завершаем документ
    doc.end();
  }
}
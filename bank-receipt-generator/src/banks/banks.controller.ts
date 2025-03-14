import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as PDFKit from 'pdfkit';
import { ReceiptPayload, BankTransactionTypeEnum, BankTransactionOperationTypeEnum, CustomerOriginEnum, CurrencyEnum } from './banks.types';
import * as QRCode from 'qrcode';
import { join } from 'path';

@Controller('banks')
export class BanksController {
  @Post('generate-receipt')
  public async generateReceipt(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() payload: ReceiptPayload,
  ) {
    const doc = new PDFKit({
      size: [226, 500], // Ширина 226 пунктов (~80 мм), начальная высота 500
      margins: { top: 10, bottom: 10, left: 10, right: 10 },
    });
    const buffers: Buffer[] = [];

    // Собираем данные в буфер
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.header('Content-Type', 'application/pdf');
      res.header('Content-Disposition', `attachment; filename=receipt-${payload.id || 'unknown'}.pdf`);
      res.send(pdfData);
    });

    // Логотип сверху посередине
    const logoPath = join(__dirname, '..', '..', 'public', 'assets', 'logo.png');
    const logoWidth = 80;
    const pageWidth = doc.page.width; // 226 пунктов
    const logoX = (pageWidth - logoWidth) / 2;
    const logoHeight = 80; // Предполагаемая высота логотипа
    doc.image(logoPath, logoX, 10, { width: logoWidth });
    const textStartY = 10 + logoHeight + 10;
    doc.y = textStartY;

    // Заголовок чека
    doc.fontSize(12).text('Bank Transaction Receipt', { align: 'center' });
    doc.moveDown(0.5);

    // Основной текст чека
    doc.fontSize(8);

    if (payload.id !== undefined && payload.id !== null) {
      doc.text(`Transaction ID: ${payload.id}`);
    }
    if (payload.providerTransactionId) {
      doc.text(`Provider Transaction ID: ${payload.providerTransactionId}`);
    }
    if (payload.id !== undefined || payload.providerTransactionId) {
      doc.moveDown(0.5);
    }

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
      doc.moveDown(0.5);
    }

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
    doc.moveDown(0.5);

    if (payload.amount) {
      const amount = Math.abs(parseFloat(payload.amount as unknown as string)).toFixed(2);
      if (!isNaN(parseFloat(amount))) {
        doc.text(`Amount: ${amount} ${payload.currency === CurrencyEnum.ARS ? 'ARS' : 'Unknown'}`);
      }
    }

    if (payload.transactionType !== undefined && payload.transactionType in BankTransactionTypeEnum) {
      doc.text(`Transaction Type: ${BankTransactionTypeEnum[payload.transactionType]}`);
    }
    if (payload.operationType !== undefined && payload.operationType in BankTransactionOperationTypeEnum) {
      doc.text(`Operation Type: ${BankTransactionOperationTypeEnum[payload.operationType]}`);
    }

    if (payload.origin) {
      doc.text(`Origin: ${payload.origin === CustomerOriginEnum.ARS ? 'Argentina' : 'Unknown'}`);
    }

    if (payload.amount || payload.transactionType !== undefined || payload.operationType !== undefined || payload.origin) {
      doc.moveDown(0.5);
    }

    if (payload.createdAt !== undefined && !isNaN(payload.createdAt)) {
      const date = new Date(payload.createdAt);
      if (date.toString() !== 'Invalid Date') {
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

    // Перемещаем курсор вниз перед QR-кодом
    doc.moveDown(2);

    // Генерируем QR-код с повышенной четкостью
    const qrData = `https://adm.localpay.online/assets/media/logos/default.svg?id=${Date.now()}`;
    const qrSize = 80; // Размер QR-кода 80x80 пикселей
    const qrX = (pageWidth - qrSize) / 2; // Центрируем
    const qrBuffer = await QRCode.toBuffer(qrData, {
      width: qrSize * 10, // Увеличиваем внутреннее разрешение (800 пикселей)
      margin: 2, // Увеличиваем внешний отступ
      scale: 1, // Отключаем масштабирование, полагаемся на width
      errorCorrectionLevel: 'H', // Высокая устойчивость к ошибкам
    });
    const currentY = doc.y; // Текущая позиция курсора
    doc.image(qrBuffer, qrX, currentY, {
      width: qrSize, // Ограничиваем размер в PDF до 80 пикселей
      height: qrSize, // Указываем явную высоту для точного соответствия
    });

    // Завершаем документ
    doc.end();
  }
}
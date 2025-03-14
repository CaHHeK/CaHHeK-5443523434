import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as PDFKit from 'pdfkit';
import { ReceiptPayload, BankTransactionTypeEnum, BankTransactionOperationTypeEnum, CustomerOriginEnum, CurrencyEnum } from './banks.types';
import * as QRCode from 'qrcode';
import { join } from 'path';
import * as fs from 'fs';
// Используем CommonJS импорт для svg-to-pdfkit
const SVGtoPDF = require('svg-to-pdfkit');

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

    // Общие размеры для логотипа и QR-кода
    const elementSize = 80; // Размер 80x80 пикселей для обоих
    const pageWidth = doc.page.width; // 226 пунктов
    const elementX = (pageWidth - elementSize) / 2; // Центрируем по горизонтали

    // Логотип сверху посередине
    const logoPath = join(__dirname, '..', '..', 'public', 'assets', 'logo.svg');
    try {
      const svgContent = fs.readFileSync(logoPath, 'utf8');
      // Используем SVGtoPDF напрямую с одинаковыми размерами
      SVGtoPDF(doc, svgContent, elementX, 10, {
        width: elementSize,
        height: elementSize, // Устанавливаем такую же высоту, как у QR-кода
        preserveAspectRatio: 'xMidYMid meet', // Центрируем и сохраняем пропорции
      });
    } catch (error) {
      console.error('Error loading or rendering SVG:', error);
      // Запасной вариант на случай ошибки
      doc.fontSize(12).text('Company Logo', elementX, 10, { width: elementSize, align: 'center' });
    }

    const textStartY = 10 + elementSize + 10; // Используем elementSize вместо logoHeight
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

    // Генерируем QR-код с повышенной чёткостью
    const qrData = `https://adm.localpay.online/assets/media/logos/default.svg?id=${Date.now()}`;
    const qrBuffer = await QRCode.toBuffer(qrData, {
      width: elementSize * 10, // Увеличиваем внутреннее разрешение (800 пикселей)
      margin: 2, // Увеличиваем внешний отступ
      scale: 1, // Отключаем масштабирование, полагаемся на width
      errorCorrectionLevel: 'H', // Высокая устойчивость к ошибкам
    });
    const currentY = doc.y; // Текущая позиция курсора
    doc.image(qrBuffer, elementX, currentY, {
      width: elementSize, // Ограничиваем размер в PDF до 80 пикселей
      height: elementSize, // Указываем явную высоту для точного соответствия
    });

    // Завершаем документ
    doc.end();
  }
}
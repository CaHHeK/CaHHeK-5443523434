import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  private readonly googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeKqhBGX1mG-oLmcaD7dhKqWwNyOU8K0Te0yhCB6baHPazaUw/formResponse';

  async submitToGoogleForm(
    data: CreateTransactionDto,
  ): Promise<{ success: boolean; status?: number; message?: string; error?: string }> {
    try {
      console.log('Input data:', data);

      const [year, month, day] = data['Date'] ? data['Date'].split('-') : ['', '', '']; // Разбиваем дату, если она есть

const formData: Record<string, string> = {};

// Заполняем formData только теми полями, которые есть в `data`
const fieldMapping: Record<string, string> = {
  'Request ID': 'entry.2089687843',
  'CustomerId': 'entry.87686495',
  'CBU': 'entry.778788129',
  'Coelsa ID': 'entry.168660517',
  'Name': 'entry.537829146',
  'Amount': 'entry.1117234379',
  'CUIT': 'entry.2094946368',
  'Receipt': 'entry.1909419695',
};

Object.entries(fieldMapping).forEach(([key, entryId]) => {
  if (data[key]) {
    formData[entryId] = data[key];
  }
});

// Добавляем дату, если она есть
if (year) formData['entry.1640211570_year'] = year;
if (month) formData['entry.1640211570_month'] = month;
if (day) formData['entry.1640211570_day'] = day;

console.log('Form data to send:', Object.fromEntries(new URLSearchParams(formData)));

const response = await axios.post(this.googleFormUrl, new URLSearchParams(formData), {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});


      console.log('Google Form response:', {
        status: response.status,
        statusText: response.statusText,
      });

      return {
        success: true,
        status: response.status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error submitting to Google Form:', errorMessage);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to submit to Google Form',
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
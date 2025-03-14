import { Controller, Post, Body } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(
    @Body() createTransactionDto: CreateTransactionDto
  ): Promise<{ success: boolean; status?: number; message?: string; error?: string }> {
    return this.transactionsService.submitToGoogleForm(createTransactionDto);
  }
}
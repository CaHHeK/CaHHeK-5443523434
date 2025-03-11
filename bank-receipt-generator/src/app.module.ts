import { Module } from '@nestjs/common';
import { BanksModule } from './banks/banks.module';

@Module({
  imports: [BanksModule],
})
export class AppModule {}
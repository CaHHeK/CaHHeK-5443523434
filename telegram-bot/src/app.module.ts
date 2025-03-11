// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramModule } from './telegram/telegram.module';
import { Merchant } from './telegram/entities/merchant.entity';
import { Balance } from './telegram/entities/balance.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '1111', // Замените на ваш пароль
      database: 'telegram_bot',
      entities: [Merchant, Balance],
      synchronize: false, // В продакшене замените на миграции
    }),
    TelegramModule,
  ],
})
export class AppModule {}
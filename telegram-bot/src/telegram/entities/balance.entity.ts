import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Merchant } from './merchant.entity';

@Entity('balances')
export class Balance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Merchant, merchant => merchant.balances)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column()
  origin: string;

  @Column()
  currency: string;

  @Column('decimal', { precision: 15, scale: 2, transformer: { to: (value) => value, from: (value) => Number(value) } })
  balance: number;

  @Column('decimal', { precision: 15, scale: 2, transformer: { to: (value) => value, from: (value) => Number(value) } })
  usd_balance: number;

  @Column('decimal', { precision: 15, scale: 2, transformer: { to: (value) => value, from: (value) => Number(value) } })
  balance_limit: number;

  @Column('decimal', { precision: 15, scale: 2, transformer: { to: (value) => value, from: (value) => Number(value) } })
  exchange_rate: number;
}
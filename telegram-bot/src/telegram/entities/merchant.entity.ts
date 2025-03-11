import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Balance } from './balance.entity';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  chat_id: string;

  @OneToMany(() => Balance, balance => balance.merchant)
  balances: Balance[];
}
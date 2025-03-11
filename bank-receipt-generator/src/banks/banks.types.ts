export enum BankTransactionTypeEnum {
    debit = 1, // outgoing transaction
    credit = 2, // incoming transaction
  }
  
  export enum BankTransactionOperationTypeEnum {
    transfer = 1,
    deposit = 2,
    withdraw = 3,
    buy = 4,
    sell = 5,
    transaction_fee = 6,
    platform_fee = 7,
    tax = 8,
  }
  
  export enum CurrencyEnum {
    unknown = '000',
    ARS = '032', // Argentine Peso
  }
  
  export enum CustomerOriginEnum {
    ARS = "032", // Argentina
  }
  
  export interface ReceiptPayload {
    id: number;
    bankAccount: {
      id: number;
      props_ARS_CBU: string;
      props_ARS_CUIT?: string;
      fullName: string;
    };
    providerTransactionId: string;
    transactionType: BankTransactionTypeEnum;
    operationType: BankTransactionOperationTypeEnum;
    origin: CustomerOriginEnum;
    currency: CurrencyEnum;
    amount: string;
    props_ARS_CBU: string;
    props_ARS_CUIT?: string;
    props_ARS_COELSA_ID?: string;
    fullName: string;
    createdAt: number;
  }
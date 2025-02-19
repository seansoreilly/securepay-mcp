export interface SecurePayConfig {
  merchantId: string;
  apiPassword: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  timeout?: number;
}

export type PaymentPayload = {
  amount: number;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  currency?: 'AUD' | 'NZD';
  orderId: string;
};

export interface ISecurePayClient {
  checkTransaction(transactionId: string): Promise<TransactionResponse>;
  getTransactionHistory(
    startDate: Date,
    endDate: Date,
    page?: number,
    pageSize?: number
  ): Promise<TransactionHistoryResponse>;
}

export interface TransactionResponse {
  id: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  amount: number;
  currency: string;
  transactionDate: Date;
  merchantReference?: string;
  errorCode?: string;
}

export interface TransactionHistoryResponse {
  transactions: TransactionResponse[];
  page: number;
  pageSize: number;
  total: number;
}

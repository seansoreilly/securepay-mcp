export interface SecurePayConfig {
  merchantId: string;
  apiPassword: string;
  baseUrl: string;
}

export type PaymentPayload = {
  amount: number;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  currency?: 'AUD' | 'NZD';
}; 
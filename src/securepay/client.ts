import axios, { AxiosInstance, AxiosError } from 'axios';
import { ISecurePayClient, SecurePayConfig, TransactionResponse, TransactionHistoryResponse } from '../types/securepay';
import { buildPaymentXml } from '../lib/xmlBuilder';

interface SecurePayErrorResponse {
  error_code: string;
}

enum SecurePayErrorCodes {
  Success = '0',
  Failed = '1', 
  BankDeclined = '2',
  NoReplyFromBank = '3',
  DataValidationFailed = '4',
  AuthenticationFailed = '5',
  TransactionDuplicated = '6',
  CancelledByUser = '7',
  SessionExpired = '8',
  TemporarySystemError = '9',
  PermanentSystemError = '10'
}

const ERROR_MESSAGES: { [key: string]: string } = {
  [SecurePayErrorCodes.Success]: 'Transaction Successful',
  [SecurePayErrorCodes.Failed]: 'Transaction Failed',
  [SecurePayErrorCodes.BankDeclined]: 'Bank Declined Transaction',
  [SecurePayErrorCodes.NoReplyFromBank]: 'No Reply from Bank',
  [SecurePayErrorCodes.DataValidationFailed]: 'Failed Data Validation',
  [SecurePayErrorCodes.AuthenticationFailed]: 'Authentication Failed',
  [SecurePayErrorCodes.TransactionDuplicated]: 'Transaction Duplicated',
  [SecurePayErrorCodes.CancelledByUser]: 'Cancelled by User',
  [SecurePayErrorCodes.SessionExpired]: 'Session Expired',
  [SecurePayErrorCodes.TemporarySystemError]: 'Temporary System Error',
  [SecurePayErrorCodes.PermanentSystemError]: 'Permanent System Error'
};

interface CreditCard {
  number: string;
  expiryMonth: string; 
  expiryYear: string;
  cvv: string;
}

interface BillingDetails {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export class SecurePayClient implements ISecurePayClient {
  private client: AxiosInstance;
  private config: SecurePayConfig;

  constructor(config: SecurePayConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/vnd.securepay+xml'
      }
    });
  }

  private handleError(error: AxiosError<SecurePayErrorResponse>) {
    if (error.response?.data?.error_code) {
      const errorCode = error.response.data.error_code;
      const errorMessage = ERROR_MESSAGES[errorCode as SecurePayErrorCodes] || 'Unknown Error';
      throw new Error(`SecurePay API Error ${errorCode}: ${errorMessage}`);
    } else {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw new Error(`SecurePay API Error: ${error.message}`);
    }
  }

  async checkTransaction(transactionId: string): Promise<TransactionResponse> {
    try {
      const response = await this.client.get(`/xmlapi/payment/${transactionId}`);
      return this.parseTransactionResponse(response.data);
    } catch (error) {
      this.handleError(error as AxiosError<SecurePayErrorResponse>);
      throw error; // TypeScript needs this even though handleError always throws
    }
  }

  async getTransactionHistory(
    startDate: Date,
    endDate: Date,
    page: number = 1,
    pageSize: number = 20
  ): Promise<TransactionHistoryResponse> {
    try {
      const response = await this.client.get('/xmlapi/reporting/transactions', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          page,
          pageSize
        }
      });
      
      return {
        transactions: response.data.transactions.map(this.parseTransactionResponse),
        page,
        pageSize,
        total: response.data.total
      };
    } catch (error) {
      this.handleError(error as AxiosError<SecurePayErrorResponse>);
      throw error;
    }
  }

  private parseTransactionResponse(data: any): TransactionResponse {
    return {
      id: data.transactionId,
      status: data.status,
      amount: parseInt(data.amount) / 100,
      currency: data.currency,
      transactionDate: new Date(data.timestamp),
      merchantReference: data.merchantReference,
      errorCode: data.errorCode
    };
  }

  async initPayment(amount: number, currency: string) {
    try {
      const messageId = Date.now().toString();
      const xml = buildPaymentXml({
        amount,
        currency: currency as 'AUD' | 'NZD',
        orderId: `ORDER-${messageId}`,
        cardNumber: '', // These will be filled in processPayment
        expiryMonth: '',
        expiryYear: '',
        cvv: ''
      }, this.config);

      console.log('Sending payment initialization request:', {
        messageId,
        amount: Math.round(amount * 100),
        currency
      });

      const response = await this.client.put(`/xmlapi/payment`, xml, {
        headers: {
          'X-Message-Id': messageId
        }
      });

      console.log('Payment initialized:', response.data);
      return { messageId, ...response.data };
    } catch (error) {
      this.handleError(error as AxiosError<SecurePayErrorResponse>);
    }
  }

  async processPayment(messageId: string, amount: number, currency: string, card: CreditCard, billingDetails: BillingDetails) {
    try {
      const xml = buildPaymentXml({
        amount,
        currency: currency as 'AUD' | 'NZD',
        orderId: `ORDER-${messageId}`,
        cardNumber: card.number,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        cvv: card.cvv
      }, this.config);

      console.log('Sending payment process request:', {
        messageId,
        card: {
          ...card,
          number: `${card.number.slice(0, 4)}...${card.number.slice(-4)}`
        }
      });

      const response = await this.client.put(`/xmlapi/payment`, xml, {
        headers: {
          'X-Message-Id': messageId
        }
      });

      console.log('Payment processed:', response.data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError<SecurePayErrorResponse>);
    }
  }
}

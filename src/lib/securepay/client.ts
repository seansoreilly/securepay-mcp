// Implementing SecurePayClient (forced update)
import { SecurePayConfig, PaymentPayload, RefundPayload, ISecurePayClient } from '../../types/securepay';
import { buildPaymentXml, buildRefundXml } from '../xmlBuilder';
import axios, { AxiosInstance, AxiosError } from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 30000; // 30 seconds

export class SecurePayClient implements ISecurePayClient {
  private client: AxiosInstance;

  constructor(private config: SecurePayConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'text/xml'
      },
      timeout: TIMEOUT
    });
  }

  async processPayment(payload: PaymentPayload) {
    const xmlBody = buildPaymentXml(payload, this.config);
    return this.post('/xmlapi/payment', xmlBody);
  }

  async processRefund(payload: RefundPayload) {
    const xmlBody = buildRefundXml(payload, this.config);
    return this.post('/xmlapi/payment', xmlBody);
  }

  async checkTransaction(transactionId: string) {
    try {
      const response = await this.client.get(`/transaction/${transactionId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`SecurePay API error: ${error.response?.data || error.message}`);
      }
      throw error;
    }
  }

  async getTransactionHistory(startDate: Date, endDate: Date, page?: number, pageSize?: number) {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    
    try {
      const response = await this.client.get('/transactions', {
        params: {
          merchantId: this.config.merchantId,
          startDate: start,
          endDate: end,
          page: page || 1,
          pageSize: pageSize || 50
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`SecurePay API error: ${error.response?.data || error.message}`);
      }
      throw error;
    }
  }

  private async post(endpoint: string, body: string, retryCount = 0): Promise<any> {
    try {
      console.log(`Request XML (attempt ${retryCount + 1}):`, body);
      
      const response = await this.client.post(endpoint, body);
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Network errors that might be worth retrying
        if (
          (error.code === 'ECONNRESET' || 
           error.code === 'ETIMEDOUT' ||
           error.code === 'ECONNABORTED') && 
          retryCount < MAX_RETRIES
        ) {
          console.log(`Network error encountered:`, error.message);
          console.log(`Base URL being used:`, this.config.baseUrl);
          console.log(`Retrying request in ${RETRY_DELAY * (retryCount + 1)}ms (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
          return this.post(endpoint, body, retryCount + 1);
        }

        // Enhanced error message with more details
        const errorMessage = error.response?.data || error.message;
        const statusCode = error.response?.status;
        throw new Error(
          `SecurePay API error: ${errorMessage}` +
          (statusCode ? ` (Status: ${statusCode})` : '') +
          (error.code ? ` (Code: ${error.code})` : '')
        );
      }
      throw error;
    }
  }
}

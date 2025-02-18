// Implementing SecurePayClient (forced update)
import { SecurePayConfig, PaymentPayload, ISecurePayClient } from '../../types/securepay';
import { buildPaymentXml } from '../xmlBuilder';

export class SecurePayClient implements ISecurePayClient {
  private accessToken: string | null = null;
  private tokenTimestamp: number | null = null;

  constructor(private config: SecurePayConfig) {}

  private async getAccessToken() {
    if (!this.accessToken || !this.tokenTimestamp || (Date.now() - this.tokenTimestamp) > 30 * 60 * 1000) {
      const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to obtain OAuth token: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenTimestamp = Date.now();
    }
    return this.accessToken;
  }

  async processPayment(payload: PaymentPayload) {
    const xmlBody = buildPaymentXml(payload, this.config);
    return this.post('/payment', xmlBody);
  }

  async checkTransaction(transactionId: string) {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.config.baseUrl}/transaction/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SecurePay API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getTransactionHistory(startDate: Date, endDate: Date, page?: number, pageSize?: number) {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    const token = await this.getAccessToken();
    const response = await fetch(`${this.config.baseUrl}/transactions?merchantId=${this.config.merchantId}&startDate=${start}&endDate=${end}&page=${page || 1}&pageSize=${pageSize || 50}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SecurePay API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async post(endpoint: string, body: string) {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`SecurePay API error: ${response.statusText}`);
    }

    return response.text();
  }
}

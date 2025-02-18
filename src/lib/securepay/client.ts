// Implementing SecurePayClient
import { SecurePayConfig, PaymentPayload } from '../../types/securepay';
import { buildPaymentXml } from '../xmlBuilder';

export class SecurePayClient {
  constructor(private config: SecurePayConfig) {}

  async processPayment(payload: PaymentPayload) {
    const xmlBody = buildPaymentXml(payload, this.config);
    return this.post('/payment', xmlBody);
  }

  private async post(endpoint: string, body: string) {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        Authorization: `Basic ${btoa(`${this.config.merchantId}:${this.config.apiPassword}`)}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`SecurePay API error: ${response.statusText}`);
    }

    return response.text();
  }
}

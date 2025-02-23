import { SecurePayClient } from './lib/securepay/client';
import { env } from './env';

export class Server {
  private client: SecurePayClient;

  constructor() {
    this.client = new SecurePayClient({
      merchantId: env.SECUREPAY_MERCHANT_ID,
      apiPassword: env.SECUREPAY_API_PASSWORD,
      baseUrl: env.SECUREPAY_SANDBOX_URL,
      clientId: '', // Not used in XML API
      clientSecret: '', // Not used in XML API
      timeout: 60
    });
  }

  async processPayment(amount: number, currency: string) {
    try {
      const result = await this.client.processPayment({
        amount,
        currency: currency as 'AUD' | 'NZD',
        orderId: `ORDER-${Date.now()}`,
        cardNumber: '4444333322221111', // Test card number
        expiryMonth: '12',
        expiryYear: '25',
        cvv: '123'
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async start() {
    try {
      // Process a $10 AUD payment
      await this.processPayment(10.00, 'AUD');
    } catch (error) {
      throw error;
    }
  }
}

const server = new Server();
server.start();

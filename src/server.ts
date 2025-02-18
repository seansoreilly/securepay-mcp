import * as dotenv from 'dotenv';
dotenv.config();
import { SecurePayClient } from './securepay/client';

interface ProcessPaymentArgs {
  paymentId: string;
  card: {
    number: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  billingDetails: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export class Server {
  private client: SecurePayClient;

  constructor() {
    this.client = new SecurePayClient();
  }

  async processPayment(paymentId: string, card: any, billingDetails: any) {
    const paymentResponse = await this.client.processPayment(
      paymentId,
      card,
      billingDetails
    );
    console.log(JSON.stringify(paymentResponse, null, 2));
  }

  async start() {
    console.log('SecurePay MCP Server started');

    const paymentId = await this.client.initPayment(100, 'USD');
    console.log('Payment initialized:', paymentId);

    const card = {
      number: '4111111111111111',
      expiryMonth: '12',
      expiryYear: '25',
      cvv: '123'
    };

    const billingDetails = {
      name: 'John Doe',
      street1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'US'
    };

    await this.processPayment(paymentId, card, billingDetails);
  }
}

const server = new Server();
server.start();

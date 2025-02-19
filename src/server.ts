import * as dotenv from 'dotenv';
dotenv.config();

import { SecurePayClient } from './securepay/client';

export class Server {
  private client: SecurePayClient;

  constructor() {
    this.client = new SecurePayClient();
  }

  async processPayment(amount: number, currency: string) {
    try {
      console.log(`Initializing payment for ${amount} ${currency}`);

      // Step 1: Initialize payment
      const { messageId } = await this.client.initPayment(amount, currency);

      // Step 2: Process payment with test card
      const card = {
        number: '4444333322221111', // Test card number
        expiryMonth: '12',
        expiryYear: '25',
        cvv: '123'
      };

      const billingDetails = {
        name: 'John Smith',
        street1: '123 Test St',
        city: 'Sydney',
        state: 'NSW',
        postalCode: '2000',
        country: 'AU'
      };

      const result = await this.client.processPayment(messageId, card, billingDetails);
      console.log('Payment completed:', result);
      return result;
    } catch (error) {
      console.error('Payment failed:', error);
      throw error;
    }
  }

  async start() {
    console.log('SecurePay MCP Server started');
    
    try {
      // Process a $10 AUD payment
      await this.processPayment(10.00, 'AUD');
    } catch (error) {
      console.error('Server error:', error);
    }
  }
}

const server = new Server();
server.start();
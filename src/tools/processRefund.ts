// Implementing processRefund MCP tool
import { createTool } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { SecurePayClient } from '../lib/securepay/client';
import { SecurePayConfig, RefundPayload } from '../types/securepay';

const config: SecurePayConfig = {
  merchantId: process.env.SECUREPAY_MERCHANT_ID || '',
  apiPassword: process.env.SECUREPAY_API_PASSWORD || '',
  baseUrl: process.env.SECUREPAY_BASE_URL || '',
  clientId: process.env.SECUREPAY_CLIENT_ID || '',
  clientSecret: process.env.SECUREPAY_CLIENT_SECRET || '',
};

const client = new SecurePayClient(config);

export const processRefund = createTool({
  name: 'process_refund',
  description: 'Process a refund for a previously settled transaction via SecurePay. Both Transaction ID (<txnID>) and Order ID/Purchase Order Number (<purchaseOrderNo>) must match the original payment transaction.',
  schema: z.object({
    amount: z.number().positive().describe('Refund amount in cents (must not exceed original transaction amount)'),
    transactionId: z.string().describe('Transaction ID from the original payment - must match exactly'),
    currency: z.enum(['AUD', 'NZD']).optional().describe('Currency code (defaults to AUD)'),
    orderId: z.string().describe('Order ID/Purchase Order Number from the original payment - must match exactly'),
  }),
  async handler({ input }: { input: RefundPayload }) {
    // First verify the transaction exists and matches the order ID
    const transaction = await client.checkTransaction(input.transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.merchantReference !== input.orderId) {
      throw new Error('Order ID does not match the original transaction');
    }

    if (transaction.status !== 'SUCCESS') {
      throw new Error('Can only refund successful transactions');
    }

    if (input.amount > transaction.amount) {
      throw new Error('Refund amount cannot exceed original transaction amount');
    }

    return client.processRefund(input);
  },
});

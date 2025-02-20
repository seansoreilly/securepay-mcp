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
  description: 'Process a refund for a previously settled transaction via SecurePay',
  schema: z.object({
    amount: z.number().positive(),
    transactionId: z.string(),
    currency: z.enum(['AUD', 'NZD']).optional(),
    orderId: z.string(),
  }),
  async handler({ input }: { input: RefundPayload }) {
    return client.processRefund(input);
  },
});

// Example tool structure from reference implementation
// Implementing processPayment MCP tool
import { createTool } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { SecurePayClient } from '../lib/securepay/client';
import { SecurePayConfig, PaymentPayload } from '../types/securepay';

const config: SecurePayConfig = {
  merchantId: process.env.SECUREPAY_MERCHANT_ID || '',
  apiPassword: process.env.SECUREPAY_API_PASSWORD || '',
  baseUrl: process.env.SECUREPAY_BASE_URL || '',
};

const client = new SecurePayClient(config);

export const processPayment = createTool({
  name: 'process_payment',
  description: 'Process credit card payment via SecurePay',
  schema: z.object({
    amount: z.number().positive(),
    cardNumber: z.string().length(16),
    expiryMonth: z.string().length(2),
    expiryYear: z.string().length(2),
    cvv: z.string().length(3),
    currency: z.enum(['AUD', 'NZD']).optional(),
  }),
  async handler({ input }: { input: PaymentPayload }) {
    return client.processPayment(input);
  },
});

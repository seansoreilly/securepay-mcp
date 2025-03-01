// Custom XML Request tool implementation
import { createTool } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { SecurePayClient } from '../lib/securepay/client';
import { SecurePayConfig } from '../types/securepay';

// Get SecurePay config from environment
const config: SecurePayConfig = {
  merchantId: process.env.SECUREPAY_MERCHANT_ID || '',
  apiPassword: process.env.SECUREPAY_API_PASSWORD || '',
  baseUrl: process.env.SECUREPAY_BASE_URL || '',
  clientId: process.env.SECUREPAY_CLIENT_ID || '',
  clientSecret: process.env.SECUREPAY_CLIENT_SECRET || '',
};

// Initialize SecurePay client
const client = new SecurePayClient(config);

// Create the custom XML request tool
export const customXmlRequest = createTool({
  name: 'custom_xml_request',
  description: 'Send a custom XML request to the SecurePay API. This allows for flexible interactions beyond standard payment and refund operations. Requires properly formatted SecurePay XML.',
  schema: z.object({
    xmlPayload: z.string()
      .min(1)
      .describe('The complete XML payload to send to SecurePay. Must follow SecurePay XML format with SecurePayMessage, MessageInfo, and MerchantInfo elements.'),
    endpoint: z.string()
      .default('/xmlapi/payment')
      .describe('The API endpoint to send the request to. Defaults to "/xmlapi/payment". Other common endpoints include "/xmlapi/directentry", "/xmlapi/periodic", "/xmlapi/token".')
  }),
  async handler({ input }: { input: { xmlPayload: string; endpoint?: string } }) {
    return client.sendCustomXmlRequest({
      xmlPayload: input.xmlPayload,
      endpoint: input.endpoint
    });
  },
});
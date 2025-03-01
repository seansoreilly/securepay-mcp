#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { SecurePayClient } from './lib/securepay/client';
import { env } from './env';
import { customXmlRequest } from './tools/customXmlRequest';

const client = new SecurePayClient({
  merchantId: env.SECUREPAY_MERCHANT_ID,
  apiPassword: env.SECUREPAY_API_PASSWORD,
  baseUrl: env.SECUREPAY_SANDBOX_URL,
  clientId: '', // Not used in XML API
  clientSecret: '', // Not used in XML API
  timeout: 60
});

const isValidProcessPaymentArgs = (args: any): args is {
  paymentId: string;
  amount: number;
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
} => {
  return typeof args === 'object' &&
    args !== null &&
    typeof args.paymentId === 'string' &&
    typeof args.amount === 'number' &&
    typeof args.card === 'object' &&
    args.card !== null &&
    typeof args.card.number === 'string' &&
    typeof args.card.expiryMonth === 'string' &&
    typeof args.card.expiryYear === 'string' &&
    typeof args.card.cvv === 'string' &&
    typeof args.billingDetails === 'object' &&
    args.billingDetails !== null &&
    typeof args.billingDetails.name === 'string' &&
    typeof args.billingDetails.street1 === 'string' &&
    typeof args.billingDetails.city === 'string' &&
    typeof args.billingDetails.state === 'string' &&
    typeof args.billingDetails.postalCode === 'string' &&
    typeof args.billingDetails.country === 'string';
};

const isValidCustomXmlRequestArgs = (args: any): args is {
  xmlPayload: string;
  endpoint?: string;
} => {
  return typeof args === 'object' &&
    args !== null &&
    typeof args.xmlPayload === 'string' &&
    (args.endpoint === undefined || typeof args.endpoint === 'string');
};

const isValidProcessRefundArgs = (args: any): args is {
  transactionId: string;
  amount: number;
  currency?: 'AUD' | 'NZD';
  orderId: string;
} => {
  return typeof args === 'object' &&
    args !== null &&
    typeof args.transactionId === 'string' &&
    typeof args.amount === 'number' &&
    typeof args.orderId === 'string' &&
    (args.currency === undefined || args.currency === 'AUD' || args.currency === 'NZD');
};

class SecurePayMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'securepay-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => {
      // Handle errors through MCP error system
      throw new McpError(ErrorCode.InternalError, error.message);
    };
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'custom_xml_request',
          description: 'Send a custom XML request to the SecurePay API',
          inputSchema: {
            type: 'object',
            properties: {
              xmlPayload: {
                type: 'string',
                description: 'The complete XML payload to send to SecurePay'
              },
              endpoint: {
                type: 'string',
                description: 'The API endpoint to send the request to (defaults to /xmlapi/payment)'
              }
            },
            required: ['xmlPayload']
          }
        },
        {
          name: 'test_echo',
          description: 'Simple test echo function',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Message to echo back'
              }
            },
            required: ['message']
          }
        },
        {
          name: 'process_payment',
          description: 'Process a payment with credit card details',
          inputSchema: {
            type: 'object',
            properties: {
              paymentId: {
                type: 'string',
                description: 'Payment ID',
              },
              amount: {
                type: 'number',
                description: 'Payment amount in cents (e.g., $10.00 = 1000 cents, $5.99 = 599 cents)',
              },
              card: {
                type: 'object',
                description: 'Credit card details',
                properties: {
                  number: {
                    type: 'string',
                    description: 'Card number',
                  },
                  expiryMonth: {
                    type: 'string',
                    description: 'Expiry month',
                  },
                  expiryYear: {
                    type: 'string',
                    description: 'Expiry year',
                  },
                  cvv: {
                    type: 'string',
                    description: 'CVV',
                  },
                },
                required: ['number', 'expiryMonth', 'expiryYear', 'cvv'],
              },
              billingDetails: {
                type: 'object',
                description: 'Billing details',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Name',
                  },
                  street1: {
                    type: 'string',
                    description: 'Street 1',
                  },
                  street2: {
                    type: 'string',
                    description: 'Street 2',
                  },
                  city: {
                    type: 'string',
                    description: 'City',
                  },
                  state: {
                    type: 'string',
                    description: 'State',
                  },
                  postalCode: {
                    type: 'string',
                    description: 'Postal code',
                  },
                  country: {
                    type: 'string',
                    description: 'Country',
                  },
                },
                required: ['name', 'street1', 'city', 'state', 'postalCode', 'country'],
              },
            },
            required: ['paymentId', 'amount', 'card', 'billingDetails'],
          },
        },
        {
          name: 'process_refund',
          description: 'Process a refund for a previously settled transaction',
          inputSchema: {
            type: 'object',
            properties: {
              transactionId: {
                type: 'string',
                description: 'Original transaction ID to refund',
              },
              amount: {
                type: 'number',
                description: 'Amount to refund in cents (e.g., $10.00 = 1000 cents, $5.99 = 599 cents)',
              },
              currency: {
                type: 'string',
                enum: ['AUD', 'NZD'],
                description: 'Currency code',
              },
              orderId: {
                type: 'string',
                description: 'Order ID for the refund',
              }
            },
            required: ['transactionId', 'amount', 'orderId'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'process_payment' && request.params.name !== 'process_refund' && request.params.name !== 'test_echo' && request.params.name !== 'check_transaction' && request.params.name !== 'get_transaction_history' && request.params.name !== 'custom_xml_request') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      if (request.params.name === 'test_echo') {
        const message = request.params.arguments?.message || 'No message provided';
        return {
          content: [
            {
              type: 'text',
              text: `Echo: ${message}`,
            },
          ],
        };
      } else if (request.params.name === 'process_payment') {
        if (!isValidProcessPaymentArgs(request.params.arguments)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid process_payment arguments'
          );
        }

        try {
          const paymentResponse = await client.processPayment({
            amount: request.params.arguments.amount,
            currency: 'AUD',
            orderId: request.params.arguments.paymentId,
            cardNumber: request.params.arguments.card.number,
            expiryMonth: request.params.arguments.card.expiryMonth,
            expiryYear: request.params.arguments.card.expiryYear,
            cvv: request.params.arguments.card.cvv
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(paymentResponse, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: `Error processing payment: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      } else if (request.params.name === 'process_refund') {
        if (!isValidProcessRefundArgs(request.params.arguments)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid process_refund arguments'
          );
        }

        try {
          const refundResponse = await client.processRefund({
            ...request.params.arguments
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(refundResponse, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: `Error processing refund: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      } else if (request.params.name === 'custom_xml_request') {
        if (!isValidCustomXmlRequestArgs(request.params.arguments)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid custom_xml_request arguments'
          );
        }

        try {
          const response = await client.sendCustomXmlRequest({
            xmlPayload: request.params.arguments.xmlPayload,
            endpoint: request.params.arguments.endpoint
          });

          return {
            content: [
              {
                type: 'text',
                text: response,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: `Error sending custom XML request: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      } else if (request.params.name === 'check_transaction') {
        // TODO: Implement check_transaction
        const transactionId = request.params.arguments?.transactionId;
        return {
          content: [
            {
              type: 'text',
              text: `check_transaction is not implemented yet for transactionId: ${transactionId}`,
            },
          ],
        };
      } else if (request.params.name === 'get_transaction_history') {
        // TODO: Implement get_transaction_history
        const merchantId = request.params.arguments?.merchantId;
        const startDate = request.params.arguments?.startDate;
        const endDate = request.params.arguments?.endDate;
        return {
          content: [
            {
              type: 'text',
              text: `get_transaction_history is not implemented yet for merchantId: ${merchantId}, startDate: ${startDate}, endDate: ${endDate}`,
            },
          ],
        };
      } else {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // Server is now running
  }
}

const server = new SecurePayMcpServer();
server.run().catch((error) => {
  throw new McpError(ErrorCode.InternalError, error.message);
});

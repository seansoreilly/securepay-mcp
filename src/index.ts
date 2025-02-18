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
import { SecurePayClient } from './securepay/client';

const client = new SecurePayClient();

const isValidProcessPaymentArgs = (args: any): args is {
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
} => {
  return typeof args === 'object' &&
    args !== null &&
    typeof args.paymentId === 'string' &&
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

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
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
            required: ['paymentId', 'card', 'billingDetails'],
          },
        },
        {
          name: 'check_transaction',
          description: 'Check the status of a transaction',
          inputSchema: {
            type: 'object',
            properties: {
              transactionId: {
                type: 'string',
                description: 'Transaction ID',
              },
            },
            required: ['transactionId'],
          },
        },
        {
          name: 'get_transaction_history',
          description: 'Get the transaction history for a merchant',
          inputSchema: {
            type: 'object',
            properties: {
              merchantId: {
                type: 'string',
                description: 'Merchant ID',
              },
              startDate: {
                type: 'string',
                description: 'Start date (YYYY-MM-DD)',
              },
              endDate: {
                type: 'string',
                description: 'End date (YYYY-MM-DD)',
              },
            },
            required: ['merchantId', 'startDate', 'endDate'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'process_payment' && request.params.name !== 'check_transaction' && request.params.name !== 'get_transaction_history') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      if (request.params.name === 'process_payment') {
        if (!isValidProcessPaymentArgs(request.params.arguments)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid process_payment arguments'
          );
        }

        try {
          const paymentResponse = await client.processPayment(
            request.params.arguments.paymentId,
            request.params.arguments.card,
            request.params.arguments.billingDetails
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(paymentResponse, null, 2),
              },
            ],
          };
        } catch (error: any) {
          console.error('Error processing payment:', error);
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
    console.error('SecurePay MCP server running on stdio');
  }
}

const server = new SecurePayMcpServer();
server.run().catch(console.error);

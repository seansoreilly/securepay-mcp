# SecurePay MCP Server

A Model Context Protocol (MCP) server that integrates with SecurePay's XML API to process payments and refunds securely.

## Overview

This project provides a bridge between AI assistants and SecurePay's payment processing system through the Model Context Protocol. It enables AI assistants to process credit card payments and refunds using SecurePay's XML API without directly handling sensitive payment information.

## Features

- **Process Credit Card Payments**: Securely process credit card payments through SecurePay's XML API
- **Process Refunds**: Handle refunds for previously settled transactions
- **MCP Integration**: Expose payment processing capabilities to AI assistants through the Model Context Protocol
- **Error Handling**: Comprehensive error handling and retry mechanisms for reliable payment processing
- **Secure Configuration**: Environment-based configuration with validation

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- SecurePay merchant account and API credentials

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/securepay-mcp.git
cd securepay-mcp
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your SecurePay credentials:

```
SECUREPAY_MERCHANT_ID=your_merchant_id
SECUREPAY_API_PASSWORD=your_api_password
SECUREPAY_SANDBOX_URL=https://test.api.securepay.com.au/xmlapi/payment
PORT=3000
NODE_ENV=development
```

## Building and Running

Build the project:

```bash
npm run build
```

Start the server:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## MCP Tools

This server exposes the following MCP tools:

### process_payment

Process a payment with credit card details.

**Parameters:**

- `paymentId` (string): A unique identifier for the payment
- `amount` (number): Payment amount in cents (e.g., $10.00 = 1000 cents)
- `card` (object): Credit card details
  - `number` (string): Card number
  - `expiryMonth` (string): Expiry month (2 digits)
  - `expiryYear` (string): Expiry year (2 digits)
  - `cvv` (string): CVV code
- `billingDetails` (object): Billing information
  - `name` (string): Cardholder name
  - `street1` (string): Street address line 1
  - `street2` (string, optional): Street address line 2
  - `city` (string): City
  - `state` (string): State or province
  - `postalCode` (string): Postal or ZIP code
  - `country` (string): Country

### process_refund

Process a refund for a previously settled transaction.

**Parameters:**

- `transactionId` (string): Original transaction ID to refund
- `amount` (number): Amount to refund in cents
- `currency` (string, optional): Currency code ('AUD' or 'NZD', defaults to 'AUD')
- `orderId` (string): Order ID for the refund (must match the original transaction)

## SecurePay XML API Integration

This project integrates with SecurePay's XML API, which provides:

- Credit card payment processing
- Refund processing
- Transaction verification
- Secure card storage (not implemented yet)
- Recurring payments (not implemented yet)

The API uses XML messages over HTTPS with merchant authentication for secure transactions.

## Testing

For testing purposes, you can use the following test credit card numbers:

- **Approved transactions**: Use amounts like 100, 108, or 1100 cents
- **Declined transactions**: Use amounts like 151, 105, or 10551 cents

Test card number: `4444333322221111` with any future expiry date and any 3-digit CVV.

## Error Handling

The server implements robust error handling:

- Automatic retries for network-related errors
- Detailed error messages with status codes
- Validation of all input parameters

## Future Enhancements

- Implement card storage functionality
- Add support for recurring payments
- Add transaction history retrieval
- Implement additional payment methods

## License

[MIT](LICENSE)

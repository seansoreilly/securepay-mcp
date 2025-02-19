import axios, { AxiosInstance, AxiosError } from 'axios';

interface SecurePayErrorResponse {
  error_code: string;
}

enum SecurePayErrorCodes {
  Success = '0',
  Failed = '1', 
  BankDeclined = '2',
  NoReplyFromBank = '3',
  DataValidationFailed = '4',
  AuthenticationFailed = '5',
  TransactionDuplicated = '6',
  CancelledByUser = '7',
  SessionExpired = '8',
  TemporarySystemError = '9',
  PermanentSystemError = '10'
}

const ERROR_MESSAGES: { [key: string]: string } = {
  [SecurePayErrorCodes.Success]: 'Transaction Successful',
  [SecurePayErrorCodes.Failed]: 'Transaction Failed',
  [SecurePayErrorCodes.BankDeclined]: 'Bank Declined Transaction',
  [SecurePayErrorCodes.NoReplyFromBank]: 'No Reply from Bank',
  [SecurePayErrorCodes.DataValidationFailed]: 'Failed Data Validation',
  [SecurePayErrorCodes.AuthenticationFailed]: 'Authentication Failed',
  [SecurePayErrorCodes.TransactionDuplicated]: 'Transaction Duplicated',
  [SecurePayErrorCodes.CancelledByUser]: 'Cancelled by User',
  [SecurePayErrorCodes.SessionExpired]: 'Session Expired',
  [SecurePayErrorCodes.TemporarySystemError]: 'Temporary System Error',
  [SecurePayErrorCodes.PermanentSystemError]: 'Permanent System Error'
};

interface CreditCard {
  number: string;
  expiryMonth: string; 
  expiryYear: string;
  cvv: string;
}

interface BillingDetails {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export class SecurePayClient {
  private client: AxiosInstance;
  private merchantId = process.env.SECUREPAY_MERCHANT_ID;
  private merchantPassword = process.env.SECUREPAY_PASSWORD;
  private baseUrl = process.env.SECUREPAY_SANDBOX_URL;

  constructor() {
    if (!this.merchantId || !this.merchantPassword || !this.baseUrl) {
      throw new Error('Missing required environment variables');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/vnd.securepay+xml'
      }
    });
  }

  private handleError(error: AxiosError<SecurePayErrorResponse>) {
    if (error.response?.data?.error_code) {
      const errorCode = error.response.data.error_code;
      const errorMessage = ERROR_MESSAGES[errorCode as SecurePayErrorCodes] || 'Unknown Error';
      throw new Error(`SecurePay API Error ${errorCode}: ${errorMessage}`);
    } else {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw new Error(`SecurePay API Error: ${error.message}`);
    }
  }

  async initPayment(amount: number, currency: string) {
    try {
      const amountInCents = Math.round(amount * 100).toString();
      const messageId = Date.now().toString();
      
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<SecurePayMessage>
  <MessageInfo>
    <messageID>${messageId}</messageID>
    <messageTimestamp>${new Date().toISOString()}</messageTimestamp>
    <timeoutValue>60</timeoutValue>
    <apiVersion>xml-4.2</apiVersion>
  </MessageInfo>
  <MerchantInfo>
    <merchantID>${this.merchantId}</merchantID>
    <password>${this.merchantPassword}</password>
  </MerchantInfo>
  <RequestType>Payment</RequestType>
  <Payment>
    <TxnList count="1">
      <Txn ID="1">
        <txnType>0</txnType>
        <txnSource>23</txnSource>
        <amount>${amountInCents}</amount>
        <currency>${currency}</currency>
        <purchaseOrderNo>ORDER-${messageId}</purchaseOrderNo>
      </Txn>
    </TxnList>
  </Payment>
</SecurePayMessage>`;

      console.log('Sending payment initialization request:', {
        messageId,
        amount: amountInCents,
        currency
      });

      const response = await this.client.put(`/xmlapi/payment/${messageId}`, xml, {
        headers: {
          'X-Message-Id': messageId
        }
      });

      console.log('Payment initialized:', response.data);
      return { messageId, ...response.data };
    } catch (error) {
      this.handleError(error as AxiosError<SecurePayErrorResponse>);
    }
  }

  async processPayment(messageId: string, card: CreditCard, billingDetails: BillingDetails) {
    try {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<SecurePayMessage>
  <MessageInfo>
    <messageID>${messageId}</messageID>
    <messageTimestamp>${new Date().toISOString()}</messageTimestamp>
    <timeoutValue>60</timeoutValue>
    <apiVersion>xml-4.2</apiVersion>
  </MessageInfo>
  <MerchantInfo>
    <merchantID>${this.merchantId}</merchantID>
    <password>${this.merchantPassword}</password>
  </MerchantInfo>
  <RequestType>Payment</RequestType>
  <Payment>
    <TxnList count="1">
      <Txn ID="1">
        <txnType>0</txnType>
        <txnSource>23</txnSource>
        <creditCard>
          <number>${card.number}</number>
          <expiryDate>${card.expiryMonth}/${card.expiryYear}</expiryDate>
          <securityCode>${card.cvv}</securityCode>
        </creditCard>
        <billing>
          <firstName>${billingDetails.name.split(' ')[0]}</firstName>
          <lastName>${billingDetails.name.split(' ').slice(1).join(' ')}</lastName>
          <street1>${billingDetails.street1}</street1>
          ${billingDetails.street2 ? `<street2>${billingDetails.street2}</street2>` : ''}
          <city>${billingDetails.city}</city>
          <state>${billingDetails.state}</state>
          <postalCode>${billingDetails.postalCode}</postalCode>
          <country>${billingDetails.country}</country>
        </billing>
      </Txn>
    </TxnList>
  </Payment>
</SecurePayMessage>`;

      console.log('Sending payment process request:', {
        messageId,
        card: {
          ...card,
          number: `${card.number.slice(0, 4)}...${card.number.slice(-4)}`
        }
      });

      const response = await this.client.put(`/xmlapi/payment/${messageId}/process`, xml, {
        headers: {
          'X-Message-Id': messageId
        }
      });

      console.log('Payment processed:', response.data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError<SecurePayErrorResponse>);
    }
  }
}
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
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private oauthUrl = process.env.SECUREPAY_OAUTH_URL;
  private baseUrl = process.env.SECUREPAY_SANDBOX_URL;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl
    });
    this.client.interceptors.request.use(config => {
      if (this.accessToken) {
        config.headers['Authorization'] = `Bearer ${this.accessToken}`;
      }
      return config;
    }, error => {
      return Promise.reject(error);
    });
  }

  private async getAccessToken(): Promise<void> {
    const clientId = process.env.SECUREPAY_CLIENT_ID;
    const clientSecret = process.env.SECUREPAY_CLIENT_SECRET;

    if (!clientId || !clientSecret || !this.oauthUrl) {
      throw new Error('Missing OAuth credentials');
    }

    if (!this.accessToken || !this.tokenExpiry || Date.now() >= this.tokenExpiry) {
      console.warn('Access token missing or expired. Fetching a new one...');
    }

    try {
      const response = await axios.post(this.oauthUrl, null, {
        params: {
          grant_type: 'client_credentials',
          audience: process.env.SECUREPAY_SANDBOX_URL
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `${clientId} ${clientSecret}`
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      console.log(`New access token obtained. Expires at: ${new Date(this.tokenExpiry).toISOString()}`);
    } catch (error) {
      console.error('Failed to obtain access token:', error);
      throw error;
    }
  }

  private handleError(error: AxiosError<SecurePayErrorResponse>) {
    if (error.response && error.response.data.error_code) {
      const errorCode = error.response.data.error_code;
      const errorMessage = ERROR_MESSAGES[errorCode as SecurePayErrorCodes] || 'Unknown Error';
      throw new Error(`SecurePay API Error ${errorCode}: ${errorMessage}`);
    } else {
      throw new Error(`SecurePay API Error: ${error.message}`);
    }
  }

  async initPayment(amount: number, currency: string) {
    await this.getAccessToken();
    try {
      const response = await this.client.post('/xmlapi/payment', {
        amount,
        currency
      });

      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError<SecurePayErrorResponse>);
    }
  }

  async processPayment(paymentId: string, card: CreditCard, billingDetails: BillingDetails) {
    await this.getAccessToken();
    try {
      const response = await this.client.post(`/xmlapi/payment/${paymentId}/process`, {
        card: {
          number: card.number,
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear,
          cvv: card.cvv
        },
        billingDetails: {
          name: billingDetails.name,
          street1: billingDetails.street1,
          street2: billingDetails.street2,
          city: billingDetails.city,
          state: billingDetails.state,
          postalCode: billingDetails.postalCode,
          country: billingDetails.country
        }
      });

      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError<SecurePayErrorResponse>);
    }
  }
}

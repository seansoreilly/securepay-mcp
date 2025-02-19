import { buildPaymentXml } from './lib/xmlBuilder';
import { PaymentPayload, SecurePayConfig } from './types/securepay';

const testPayload: PaymentPayload = {
  amount: 199.99,
  cardNumber: '4444333322221111',
  expiryMonth: '09',
  expiryYear: '10',
  cvv: '000',
  currency: 'AUD',
  orderId: 'TEST-9876'
};

const testConfig: SecurePayConfig = {
  merchantId: 'TEST123',
  apiPassword: 'testpass',
  baseUrl: 'https://test.api.securepay.com.au',
  clientId: '',
  clientSecret: '',
  timeout: 60
};

console.log(buildPaymentXml(testPayload, testConfig));

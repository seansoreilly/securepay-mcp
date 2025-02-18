import { env } from './env';

export const config = {
  port: env.PORT,
  securePay: {
    // From template's environment validation
    merchantId: env.SECUREPAY_MERCHANT_ID,
    apiPassword: env.SECUREPAY_API_PASSWORD,
    // Sandbox vs production endpoints
    baseUrl: env.NODE_ENV === 'production' 
      ? 'https://api.securepay.com.au/xmlapi/' 
      : 'https://test.api.securepay.com.au/xmlapi/'
  }
}; 
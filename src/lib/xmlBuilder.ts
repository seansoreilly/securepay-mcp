// Restoring XML builder for SecurePay
import { Builder } from 'xml2js';
import { SecurePayConfig, PaymentPayload } from '../types/securepay';

export function buildPaymentXml(payload: PaymentPayload, config: SecurePayConfig) {
  const builder = new Builder({ headless: true });
  return builder.buildObject({
    Payment: {
      MerchantID: config.merchantId,
      Password: config.apiPassword,
      TxnList: {
        $: { count: 1 },
        Txn: {
          $: { ID: 1 },
          amount: payload.amount.toFixed(2),
          cardNumber: payload.cardNumber,
          expiryDate: `${payload.expiryMonth}/${payload.expiryYear}`,
          cvv: payload.cvv,
          currency: payload.currency || 'AUD'
        }
      }
    }
  });
}

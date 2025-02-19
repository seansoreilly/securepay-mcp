// Restoring XML builder for SecurePay
import { Builder } from 'xml2js';
import { v4 as uuidv4 } from 'uuid';
import { SecurePayConfig, PaymentPayload } from '../types/securepay';

export function buildPaymentXml(payload: PaymentPayload, config: SecurePayConfig) {
  const builder = new Builder({ headless: true });
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 17) + '000+660';

  return builder.buildObject({
    SecurePayMessage: {
      MessageInfo: {
        messageID: uuidv4().replace(/-/g, '').slice(0, 30),
        messageTimestamp: timestamp,
        timeoutValue: config.timeout || '60',
        apiVersion: 'xml-4.2'
      },
      MerchantInfo: {
        merchantID: config.merchantId,
        password: config.apiPassword
      },
      RequestType: 'Payment',
      Payment: {
        TxnList: {
          $: { count: '1' },
          Txn: {
            $: { ID: '1' },
            txnType: '0',
            txnSource: '23',
            amount: String(Math.round(payload.amount * 100)),
            currency: payload.currency || 'AUD',
            purchaseOrderNo: payload.orderId,
            CreditCardInfo: {
              cardNumber: payload.cardNumber,
              expiryDate: `${String(payload.expiryMonth).padStart(2, '0')}/${String(payload.expiryYear).slice(-2)}`,
              cvv: payload.cvv
            }
          }
        }
      }
    }
  });
}

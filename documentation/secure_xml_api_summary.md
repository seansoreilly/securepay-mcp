# Secure XML API - Summary

## **Overview**
Secure XML API is used to integrate with SecurePay for secure transactions, including **card storage, triggered payments, scheduled payments, refunds, and direct entry transactions**. The API operates over **HTTPS using XML messages**, with requests and responses structured according to SecurePay’s specifications.

## **API Features**
### **Card Storage & Payments**
- **Card Storage**:
  - Store card details securely using a **Payor ID** or **Token**.
  - Tokens can be used for future transactions without storing card details directly.
  - Lookup stored tokens.
  - Edit or delete stored card details.

- **Triggered Payments**:
  - Process a **one-off** payment against stored card details or tokens.

- **Scheduled Payments**:
  - Set up **future** or **recurring** payments at specified intervals.

### **Credit Card Transactions**
- **Payment**
- **Refund**
- **Account Verification** (ensures card validity)
- **Preauthorisation & Completion**
- **FraudGuard** (optional fraud detection)
- **Echo** (service availability check)

### **Direct Entry Transactions**
- **Direct Debit** (charge a bank account)
- **Direct Credit** (transfer funds to a bank account)

## **Security & Authentication**
- SecurePay uses **HTTPS and SSL encryption**.
- Each merchant has a **unique transaction password** for authentication.
- **TLS 1.2 or TLS 1.3 is required** (older versions are not supported).

## **Test & Live Environments**
| Transaction Type | Test URL | Live URL |
|-----------------|-----------------------------|-----------------------------|
| Triggered & Scheduled Payments | `https://test.api.securepay.com.au/xmlapi/periodic` | `https://api.securepay.com.au/xmlapi/periodic` |
| Card Storage (Token) | `https://test.api.securepay.com.au/xmlapi/token` | `https://api.securepay.com.au/xmlapi/token` |
| Credit Card Payments | `https://test.api.securepay.com.au/xmlapi/payment` | `https://api.securepay.com.au/xmlapi/payment` |
| Direct Entry Transactions | `https://test.api.securepay.com.au/xmlapi/directentry` | `https://api.securepay.com.au/xmlapi/directentry` |
| FraudGuard | `https://test.api.securepay.com.au/antifraud/payment` | `https://api.securepay.com.au/antifraud/payment` |

## **XML Message Structure**
### **Request Format**
Requests use `POST` method with `text/xml` content type.

Example **Triggered Payment Request**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<SecurePayMessage>
   <MessageInfo>
      <messageID>unique-id-12345</messageID>
      <messageTimestamp>20250201000000+600</messageTimestamp>
      <timeoutValue>60</timeoutValue>
      <apiVersion>spxml-3.0</apiVersion>
   </MessageInfo>
   <MerchantInfo>
      <merchantID>ABC0001</merchantID>
      <password>abc123</password>
   </MerchantInfo>
   <RequestType>Periodic</RequestType>
   <Periodic>
      <PeriodicList count="1">
         <PeriodicItem ID="1">
            <actionType>trigger</actionType>
            <transactionReference>PaymentReference</transactionReference>
            <clientID>testUser</clientID>
            <amount>1400</amount>
         </PeriodicItem>
      </PeriodicList>
   </Periodic>
</SecurePayMessage>
```

## **Transaction Codes**
| **Transaction Type** | **Code** |
|----------------------|---------|
| Payment | `0` |
| Refund | `4` |
| Account Verification | `40` |
| Preauthorisation | `10` |
| Preauthorisation Completion | `11` |
| Direct Debit | `15` |
| Direct Credit | `17` |

## **Simulating Test Transactions**
Use specific amounts to trigger **approved** or **declined** transactions.

| **Amount (Cents)** | **Result** |
|--------------------|-----------|
| 100, 108, 1100 | Approved |
| 151, 105, 10551 | Declined |

## **Standing Instructions (Recurring Payments)**
- **SI Type 1**: Recurring
- **SI Type 2**: Instalment
- **SI Type 3**: Unscheduled Credential on File (UCOF)

## **Integration Steps**
1. **Obtain SecurePay Merchant Credentials**.
2. **Use the Test Environment** to validate API requests.
3. **Format XML Messages** according to SecurePay’s specifications.
4. **Send transactions via POST to SecurePay**.
5. **Handle API Responses** and process results.
6. **Implement security best practices** (TLS 1.2/1.3, password protection).
7. **Move to Live Environment** once testing is complete.

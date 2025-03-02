# SecurePay MCP Quick Start Guide

## Overview
This guide explains how to use the SecurePay MCP integration without needing to search through the codebase.

## Available Functions

### 1. Process Payment
Process a credit card payment with SecurePay.

```javascript
process_payment({
  amount: 1000,        // Amount in CENTS (not dollars)
  cardNumber: "4444333322221111",
  expiryMonth: "08", 
  expiryYear: "25",    // 2-digit year
  cvv: "123",
  currency: "AUD",     // "AUD" or "NZD"
  orderId: "ORDER-123" // Your reference for this transaction
})
```

### 2. Custom XML Request
Send a custom XML payload for more advanced operations.

```javascript
custom_xml_request({
  endpoint: "/xmlapi/payment", // Can also be "/xmlapi/directentry", "/xmlapi/periodic", "/xmlapi/token"
  xmlPayload: "<SecurePayMessage>...</SecurePayMessage>"
})
```

## Important Notes

1. **Amounts are in CENTS** - $10.00 = 1000 cents
2. **Test card number**: 4444333322221111
3. **Test environment credentials**:
   - Merchant ID: ABC0001
   - Password: abc123
   
4. **Test approval/decline amounts**:
   - Approval: Use amounts ending in 00, 08, 11, or 16 (e.g., 100, 1008)
   - Decline: Use other amount values

5. **For refunds**:
   - The purchase order number (orderId) must match the original transaction
   - You need the original transaction ID

## Example XML Templates

### Payment XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<SecurePayMessage>
  <MessageInfo>
    <messageID>8af793f9af34bea0cf40f5fb750f64</messageID>
    <messageTimestamp>20250201000000000+660</messageTimestamp>
    <timeoutValue>60</timeoutValue>
    <apiVersion>xml-4.2</apiVersion>
  </MessageInfo>
  <MerchantInfo>
    <merchantID>ABC0001</merchantID>
    <password>abc123</password>
  </MerchantInfo>
  <RequestType>Payment</RequestType>
  <Payment>
    <TxnList count="1">
      <Txn ID="1">
        <txnType>0</txnType>
        <txnSource>23</txnSource>
        <amount>1000</amount>
        <currency>AUD</currency>
        <purchaseOrderNo>ORDER-123</purchaseOrderNo>
        <CreditCardInfo>
          <cardNumber>4444333322221111</cardNumber>
          <expiryDate>08/25</expiryDate>
          <cvv>123</cvv>
        </CreditCardInfo>
      </Txn>
    </TxnList>
  </Payment>
</SecurePayMessage>
```

### Refund XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<SecurePayMessage>
  <MessageInfo>
    <messageID>8af793f9af34bea0cf40f5fb750f64</messageID>
    <messageTimestamp>20250201000000000+660</messageTimestamp>
    <timeoutValue>60</timeoutValue>
    <apiVersion>xml-4.2</apiVersion>
  </MessageInfo>
  <MerchantInfo>
    <merchantID>ABC0001</merchantID>
    <password>abc123</password>
  </MerchantInfo>
  <RequestType>Payment</RequestType>
  <Payment>
    <TxnList count="1">
      <Txn ID="1">
        <txnType>4</txnType>
        <txnSource>23</txnSource>
        <amount>1000</amount>
        <purchaseOrderNo>ORDER-123</purchaseOrderNo>
        <txnID>ORIGINAL_TXN_ID</txnID>
      </Txn>
    </TxnList>
  </Payment>
</SecurePayMessage>
```

## Transaction Types
- `0`: Standard Payment
- `4`: Refund
- `10`: Preauthorisation
- `11`: Preauthorisation Complete
- `15`: Direct Debit
- `17`: Direct Credit
- `40`: Account Verification
# SecurePay MCP Integration Instructions

This project demonstrates the use of the securepay-mcp MCP server for processing payments through the SecurePay XML API.

## Important Usage Notes

- Use `process_payment` to submit payments, do not use any other method.
- When refunding, the purchase order number must be the same as the purchase order of the original payment.
- The payment amount is always in **cents, not dollars**. For example, $10.00 = 1000 cents.
- Refer to `QUICKSTART_SECUREPAY.md` for detailed examples and API reference.

## Basic Payment Example

```javascript
process_payment({
  amount: 1000,        // $10.00 (in cents)
  cardNumber: "4444333322221111",
  expiryMonth: "08", 
  expiryYear: "25",    
  cvv: "123",
  currency: "AUD",     
  orderId: "ORDER-123" 
})
```

## Test Environment

- Test card: 4444333322221111, CVV: 123, Expiry: any future date
- For testing, amounts ending in 00, 08, 11, or 16 will be approved; other amounts will be declined.

For advanced operations, check `QUICKSTART_SECUREPAY.md` which contains XML templates and detailed instructions.

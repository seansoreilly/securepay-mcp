# SecurePay Custom XML Request Implementation

## Overview

The SecurePay MCP server provides a `custom_xml_request` tool that allows for sending arbitrary XML payloads to the SecurePay API. This enables flexible interactions with the SecurePay system beyond the standard payment and refund operations.

## Tool Definition

The `custom_xml_request` tool is defined with the following parameters:

- **xmlPayload** (required): The complete XML payload to send to SecurePay. Must follow SecurePay XML format with SecurePayMessage, MessageInfo, and MerchantInfo elements.
- **endpoint** (optional): The API endpoint to send the request to. Defaults to "/xmlapi/payment". Other common endpoints include "/xmlapi/directentry", "/xmlapi/periodic", "/xmlapi/token".

## Implementation

The tool is implemented using the `createTool` function from the MCP SDK, which provides a clean way to define the tool's schema and handler function. The handler uses the SecurePayClient to send the custom XML request to the SecurePay API.

```typescript
// Custom XML Request tool implementation
import { createTool } from "@modelcontextprotocol/sdk";
import { z } from "zod";
import { SecurePayClient } from "../lib/securepay/client";
import { SecurePayConfig } from "../types/securepay";

// Get SecurePay config from environment
const config: SecurePayConfig = {
  merchantId: process.env.SECUREPAY_MERCHANT_ID || "",
  apiPassword: process.env.SECUREPAY_API_PASSWORD || "",
  baseUrl: process.env.SECUREPAY_BASE_URL || "",
  clientId: process.env.SECUREPAY_CLIENT_ID || "",
  clientSecret: process.env.SECUREPAY_CLIENT_SECRET || "",
};

// Initialize SecurePay client
const client = new SecurePayClient(config);

// Create the custom XML request tool
export const customXmlRequest = createTool({
  name: "custom_xml_request",
  description:
    "Send a custom XML request to the SecurePay API. This allows for flexible interactions beyond standard payment and refund operations. Requires properly formatted SecurePay XML.",
  schema: z.object({
    xmlPayload: z
      .string()
      .min(1)
      .describe(
        "The complete XML payload to send to SecurePay. Must follow SecurePay XML format with SecurePayMessage, MessageInfo, and MerchantInfo elements."
      ),
    endpoint: z
      .string()
      .default("/xmlapi/payment")
      .describe(
        'The API endpoint to send the request to. Defaults to "/xmlapi/payment". Other common endpoints include "/xmlapi/directentry", "/xmlapi/periodic", "/xmlapi/token".'
      ),
  }),
  async handler({
    input,
  }: {
    input: { xmlPayload: string; endpoint?: string };
  }) {
    return client.sendCustomXmlRequest({
      xmlPayload: input.xmlPayload,
      endpoint: input.endpoint,
    });
  },
});
```

## Integration with MCP Server

To integrate the custom XML request tool with the MCP server, you need to:

1. Import the tool from its module
2. Add it to the list of tools in the server's tool handler

```typescript
import { customXmlRequest } from "./tools/customXmlRequest";

// In your setupToolHandlers method:
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "custom_xml_request") {
    if (!isValidCustomXmlRequestArgs(request.params.arguments)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Invalid custom_xml_request arguments"
      );
    }

    try {
      const response = await client.sendCustomXmlRequest({
        xmlPayload: request.params.arguments.xmlPayload,
        endpoint: request.params.arguments.endpoint,
      });

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error sending custom XML request: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Handle other tools...
});
```

## Example Usage

Here's an example of how to use the custom XML request tool:

```json
{
  "xmlPayload": "<SecurePayMessage><MessageInfo>...</MessageInfo><MerchantInfo>...</MerchantInfo><RequestType>...</RequestType>...</SecurePayMessage>",
  "endpoint": "/xmlapi/payment"
}
```

## Security Considerations

When implementing the custom XML request tool, consider the following security aspects:

1. **Input Validation**: Always validate that the XML payload follows the expected format
2. **Authentication**: Ensure that the SecurePay credentials are securely stored and accessed
3. **Error Handling**: Properly handle and log errors without exposing sensitive information
4. **Rate Limiting**: Implement rate limiting to prevent abuse of the API

## Common SecurePay XML Endpoints

- **/xmlapi/payment**: For standard payment processing
- **/xmlapi/directentry**: For direct entry payments
- **/xmlapi/periodic**: For recurring payments
- **/xmlapi/token**: For token-based transactions

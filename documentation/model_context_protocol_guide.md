# Model Context Protocol (MCP) Implementation Guide for TypeScript

## What is Model Context Protocol (MCP)?

The Model Context Protocol (MCP) is an open protocol that enables seamless integration between Large Language Model (LLM) applications and external data sources or tools. It provides a standardized way for LLMs to interact with various systems, APIs, and data sources without requiring custom integration code for each new tool.

## Core Components of MCP

1. **MCP Servers**: Act as bridges to connect APIs, databases, or code. They expose data sources as tools to the host.
2. **MCP Clients**: Use the protocol to interact with MCP servers.
3. **MCP Hosts**: Manage communication between servers and clients, ensuring smooth data exchange. Examples include Claude Desktop, Zed, and Sourcegraph Cody.

## Implementing an MCP Server in TypeScript

### 1. Installation

```bash
npm install @modelcontextprotocol/sdk
```

### 2. Basic Server Structure

```typescript
import * as dotenv from "dotenv";
dotenv.config();
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

class MyMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "my-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => {
      throw new McpError(ErrorCode.InternalError, error.message);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // Tool handlers will be defined here
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // Server is now running
  }
}

const server = new MyMcpServer();
server.run().catch((error) => {
  throw new McpError(ErrorCode.InternalError, error.message);
});
```

### 3. Defining Tools

MCP tools are defined in two parts:

1. **Tool Definition**: Describes the tool's name, description, and input schema
2. **Tool Handler**: Implements the tool's functionality

#### Example: Tool Definition

```typescript
this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "example_tool",
      description: "An example tool that does something useful",
      inputSchema: {
        type: "object",
        properties: {
          param1: {
            type: "string",
            description: "First parameter description",
          },
          param2: {
            type: "number",
            description: "Second parameter description",
          },
        },
        required: ["param1"],
      },
    },
  ],
}));
```

#### Example: Tool Handler

```typescript
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "example_tool") {
    // Validate arguments
    const param1 = request.params.arguments?.param1;
    const param2 = request.params.arguments?.param2 || 0;

    // Implement tool logic
    const result = `Processed ${param1} with value ${param2}`;

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  } else {
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${request.params.name}`
    );
  }
});
```

### 4. Alternative Approach Using createTool

For more complex tools, you can use the `createTool` function from the SDK:

```typescript
import { createTool } from "@modelcontextprotocol/sdk";
import { z } from "zod";

export const exampleTool = createTool({
  name: "example_tool",
  description: "An example tool that does something useful",
  schema: z.object({
    param1: z.string().describe("First parameter description"),
    param2: z.number().optional().describe("Second parameter description"),
  }),
  async handler({ input }) {
    // Implement tool logic
    const result = `Processed ${input.param1} with value ${input.param2 || 0}`;
    return result;
  },
});
```

### 5. Running the Server

MCP servers can use different transport mechanisms:

1. **StdioServerTransport**: For command-line interfaces
2. **HttpServerTransport**: For HTTP-based communication with Server-Sent Events (SSE)

Example with stdio:

```typescript
const transport = new StdioServerTransport();
await this.server.connect(transport);
```

## Best Practices

1. **Error Handling**: Use the McpError class with appropriate error codes
2. **Input Validation**: Always validate input parameters before processing
3. **Documentation**: Provide clear descriptions for tools and parameters
4. **Modular Design**: Separate tool definitions and implementations for maintainability
5. **Environment Variables**: Use dotenv for configuration management

## Advanced Features

### 1. Resources

Resources allow MCP servers to provide structured data to clients:

```typescript
this.server.setCapabilities({
  resources: {
    myResource: {
      description: "A useful resource",
      schema: {
        type: "object",
        properties: {
          data: { type: "string" },
        },
      },
    },
  },
});
```

### 2. Prompts

Prompts help guide LLM interactions:

```typescript
this.server.setCapabilities({
  prompts: {
    myPrompt: {
      description: "A helpful prompt",
      text: "This is a prompt template with {{variable}}",
    },
  },
});
```

## Conclusion

The Model Context Protocol provides a standardized way to connect LLMs with external tools and data sources. By implementing an MCP server in TypeScript, you can create reusable tools that can be accessed by any MCP-compatible host, making your integrations more flexible and maintainable.

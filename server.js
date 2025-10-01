import express from 'express';
import cors from 'cors';
import twilio from 'twilio';

const app = express();
app.use(cors());
app.use(express.json());

// Twilio setup using environment variables
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: "ok",
    mcp_version: "1.0"
  });
});

// OAuth discovery (return minimal spec)
app.get('/.well-known/oauth-authorization-server', (req, res) => {
  res.json({
    issuer: "https://whatsapp-mcp-production-e11b.up.railway.app",
    authorization_endpoint: "https://whatsapp-mcp-production-e11b.up.railway.app/oauth/authorize",
    token_endpoint: "https://whatsapp-mcp-production-e11b.up.railway.app/oauth/token"
  });
});

// MCP server info endpoint
app.get('/mcp/info', (req, res) => {
  res.json({
    name: 'whatsapp-mcp',
    version: '1.0.0',
    capabilities: {
      tools: {},
    },
  });
});

// List available tools
app.post('/mcp/tools/list', (req, res) => {
  res.json({
    tools: [
      {
        name: 'send_whatsapp',
        description: 'Send a WhatsApp message to Siddharth',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'The message to send',
            },
          },
          required: ['message'],
        },
      },
    ],
  });
});

// Execute tool
app.post('/mcp/tools/call', async (req, res) => {
  const { name, arguments: args } = req.body.params;

  if (name === 'send_whatsapp') {
    try {
      const result = await twilioClient.messages.create({
        from: 'whatsapp:+14155238886', // Twilio sandbox
        to: 'whatsapp:+917338231005',
        body: args.message,
      });

      res.json({
        content: [
          {
            type: 'text',
            text: `✓ WhatsApp sent: ${args.message}`,
          },
        ],
      });
    } catch (error) {
      res.json({
        content: [
          {
            type: 'text',
            text: `✗ Error: ${error.message}`,
          },
        ],
        isError: true,
      });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});

import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "LinhKienLed1000 API",
    description:
      "AI-powered customer support agent API. Multi-channel support for WhatsApp, Email, Phone, Facebook Messenger, and Instagram Direct Messaging with autonomous AI actions.",
    version: "2026-04-07",
    contact: {
      name: "Hesper Labs",
      url: "https://github.com/Hesper-Labs/owly",
    },
    license: {
      name: "MIT",
      url: "https://github.com/Hesper-Labs/owly/blob/main/LICENSE",
    },
  },
  servers: [{ url: "/api", description: "Current server" }],
  tags: [
    { name: "Auth", description: "Authentication and setup" },
    { name: "Conversations", description: "Customer conversation management" },
    { name: "Messages", description: "Conversation messages" },
    { name: "Tickets", description: "Support ticket management" },
    { name: "Customers", description: "Customer CRM" },
    { name: "Knowledge", description: "Knowledge base management" },
    { name: "Team", description: "Team members and departments" },
    { name: "Automation", description: "Automation rules engine" },
    { name: "Webhooks", description: "Webhook management and delivery" },
    {
      name: "Meta Shared Webhook",
      description: "Shared Meta webhook callback for Facebook Messenger and Instagram Direct Messaging",
    },
    {
      name: "Facebook Messenger",
      description: "Facebook Page Messenger setup, payload mapping, and channel config",
    },
    {
      name: "Instagram Direct Messaging",
      description:
        "Instagram Direct Messaging API / Instagram API with Instagram Login setup, payload mapping, and channel config",
    },
    { name: "Chat", description: "AI chat inference" },
    { name: "Settings", description: "System configuration" },
    { name: "Admin", description: "User and API key management" },
    { name: "Analytics", description: "Statistics and analytics" },
    { name: "System", description: "Health check and system info" },
  ],
  paths: {
    "/auth": {
      get: {
        tags: ["Auth"],
        summary: "Check auth status",
        responses: { "200": { description: "Auth status with user info or setup requirement" } },
      },
      post: {
        tags: ["Auth"],
        summary: "Login, setup, or logout",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  action: { type: "string", enum: ["login", "setup", "logout"] },
                  username: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Success with auth token cookie" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/conversations": {
      get: {
        tags: ["Conversations"],
        summary: "List conversations (paginated)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          {
            name: "channel",
            in: "query",
            schema: {
              type: "string",
              enum: ["whatsapp", "email", "phone", "facebook", "instagram", "api"],
            },
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["active", "resolved", "closed", "escalated"] },
          },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Paginated conversation list" } },
      },
      post: {
        tags: ["Conversations"],
        summary: "Create a conversation",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["channel"],
                properties: {
                  channel: { type: "string" },
                  customerName: { type: "string" },
                  customerContact: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Created conversation" } },
      },
    },
    "/conversations/{id}": {
      get: {
        tags: ["Conversations"],
        summary: "Get conversation detail with messages, customer, tickets, and tags",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Conversation detail" },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["Conversations"],
        summary: "Update conversation",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Updated conversation" } },
      },
      delete: {
        tags: ["Conversations"],
        summary: "Delete conversation",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/conversations/{id}/messages": {
      get: {
        tags: ["Messages"],
        summary: "List messages in conversation",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Message list" } },
      },
      post: {
        tags: ["Messages"],
        summary: "Add message to conversation",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "201": { description: "Created message" } },
      },
    },
    "/tickets": {
      get: {
        tags: ["Tickets"],
        summary: "List tickets (paginated)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "priority", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Paginated ticket list" } },
      },
      post: {
        tags: ["Tickets"],
        summary: "Create a ticket",
        responses: { "201": { description: "Created ticket" } },
      },
    },
    "/customers": {
      get: {
        tags: ["Customers"],
        summary: "List customers (paginated)",
        responses: { "200": { description: "Paginated customer list" } },
      },
      post: {
        tags: ["Customers"],
        summary: "Create a customer",
        responses: { "201": { description: "Created customer" } },
      },
    },
    "/customers/{id}": {
      get: {
        tags: ["Customers"],
        summary: "Get customer detail with cross-channel conversations",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Customer with conversations" } },
      },
      put: {
        tags: ["Customers"],
        summary: "Update customer",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        tags: ["Customers"],
        summary: "Delete customer",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/customers/{id}/conversations": {
      get: {
        tags: ["Customers"],
        summary: "Unified cross-channel conversation timeline for a customer",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "channel", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Paginated conversation list across all channels" } },
      },
    },
    "/chat": {
      post: {
        tags: ["Chat"],
        summary: "Send a message and get AI response",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string", maxLength: 10000 },
                  conversationId: { type: "string" },
                  channel: { type: "string" },
                  customerName: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "AI response with conversation ID" } },
      },
    },
    "/knowledge/entries": {
      get: {
        tags: ["Knowledge"],
        summary: "List knowledge entries (paginated)",
        responses: { "200": { description: "Paginated entries" } },
      },
      post: {
        tags: ["Knowledge"],
        summary: "Create knowledge entry",
        responses: { "201": { description: "Created entry" } },
      },
    },
    "/knowledge/categories": {
      get: {
        tags: ["Knowledge"],
        summary: "List categories (paginated)",
        responses: { "200": { description: "Paginated categories" } },
      },
      post: {
        tags: ["Knowledge"],
        summary: "Create category",
        responses: { "201": { description: "Created" } },
      },
    },
    "/automation": {
      get: {
        tags: ["Automation"],
        summary: "List automation rules (paginated)",
        responses: { "200": { description: "Paginated rules" } },
      },
      post: {
        tags: ["Automation"],
        summary: "Create automation rule",
        responses: { "201": { description: "Created rule" } },
      },
    },
    "/webhooks": {
      get: {
        tags: ["Webhooks"],
        summary: "List webhooks (paginated)",
        responses: { "200": { description: "Paginated webhooks" } },
      },
      post: {
        tags: ["Webhooks"],
        summary: "Create webhook",
        responses: { "201": { description: "Created webhook" } },
      },
    },
    "/webhooks/meta": {
      get: {
        tags: ["Meta Shared Webhook"],
        summary: "Verify shared Meta webhook",
        description:
          "Verifies the shared callback for Facebook Messenger and Instagram Direct Messaging. If hub.mode=subscribe and hub.verify_token matches Settings > Facebook/Instagram or META_VERIFY_TOKEN, the route returns hub.challenge as text/plain.",
        security: [],
        parameters: [
          {
            name: "hub.mode",
            in: "query",
            required: true,
            description:
              "Always use subscribe. Meta sends this value when verifying the webhook callback.",
            schema: { type: "string", default: "subscribe", example: "subscribe" },
          },
          {
            name: "hub.verify_token",
            in: "query",
            required: true,
            schema: { type: "string", example: "my-verify-token" },
          },
          {
            name: "hub.challenge",
            in: "query",
            required: true,
            description: "Challenge string returned as text when verification succeeds.",
            schema: { type: "string", default: "hello123", example: "hello123" },
          },
        ],
        responses: {
          "200": { description: "Plain text challenge string" },
          "403": { description: "Invalid verify token" },
          "500": { description: "Verify token is not configured" },
        },
      },
      post: {
        tags: ["Meta Shared Webhook"],
        summary: "Receive shared Meta webhook events",
        description:
          "Receives Meta webhook events, maps object=page to channel=facebook and object=instagram to channel=instagram, stores customer contacts as facebook:<psid> or instagram:<sender_id>, runs the existing chat pipeline, and replies through Meta Send API. Current phase handles text messages only; non-text, delivery/read, reaction, and echo events are ignored.",
        security: [],
        parameters: [
          {
            name: "x-hub-signature-256",
            in: "header",
            required: false,
            schema: { type: "string" },
            description:
              "Required when META_APP_SECRET or a channel appSecret is configured.",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { oneOf: [{ $ref: "#/components/schemas/MetaFacebookWebhookPayload" }, { $ref: "#/components/schemas/MetaInstagramWebhookPayload" }] },
              examples: {
                facebook: {
                  value: {
                    object: "page",
                    entry: [
                      {
                        messaging: [
                          {
                            sender: { id: "USER_PSID" },
                            recipient: { id: "PAGE_ID" },
                            message: { text: "Hello" },
                          },
                        ],
                      },
                    ],
                  },
                },
                instagram: {
                  value: {
                    object: "instagram",
                    entry: [
                      {
                        messaging: [
                          {
                            sender: { id: "IG_SENDER_ID" },
                            recipient: { id: "IG_BUSINESS_ID" },
                            message: { text: "Hello" },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Accepted or ignored valid payload" },
          "400": { description: "Invalid JSON payload" },
          "401": { description: "Invalid signature" },
        },
      },
    },
    "/channels": {
      get: {
        tags: ["Facebook Messenger", "Instagram Direct Messaging", "Settings"],
        summary: "List channels with sanitized Meta config",
        description:
          "Lists configured channels, including facebook and instagram. GET responses never return raw access tokens or app secrets; they expose flags such as hasPageAccessToken, hasAccessToken, and hasAppSecret.",
        responses: { "200": { description: "Channel list with sanitized config" } },
      },
      post: {
        tags: ["Facebook Messenger", "Instagram Direct Messaging", "Settings"],
        summary: "Create or update a channel config",
        description:
          "Creates or updates channel config. For Meta channels, DB config takes priority over .env fallback. If token/appSecret fields are blank or masked on save, the existing secret is preserved.",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChannelConfigRequest" },
              examples: {
                facebook: {
                  value: {
                    type: "facebook",
                    isActive: true,
                    config: {
                      verifyToken: "my-verify-token",
                      pageAccessToken: "YOUR_FACEBOOK_PAGE_ACCESS_TOKEN",
                      pageId: "OPTIONAL_PAGE_ID",
                      graphVersion: "v25.0",
                      appSecret: "YOUR_META_APP_SECRET",
                    },
                  },
                },
                instagram: {
                  value: {
                    type: "instagram",
                    isActive: true,
                    config: {
                      verifyToken: "my-verify-token",
                      accessToken: "YOUR_INSTAGRAM_ACCESS_TOKEN",
                      businessAccountId: "OPTIONAL_INSTAGRAM_BUSINESS_ACCOUNT_ID",
                      graphVersion: "v25.0",
                      appSecret: "YOUR_META_APP_SECRET",
                    },
                  },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Saved channel with sanitized config" } },
      },
    },
    "/channels/{type}": {
      get: {
        tags: ["Facebook Messenger", "Instagram Direct Messaging", "Settings"],
        summary: "Get one channel config",
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: {
              type: "string",
              enum: ["facebook", "instagram", "whatsapp", "email", "phone", "zalo"],
              default: "facebook",
              example: "facebook",
            },
          },
        ],
        responses: { "200": { description: "One channel with sanitized config" } },
      },
      put: {
        tags: ["Facebook Messenger", "Instagram Direct Messaging", "Settings"],
        summary: "Update one channel config",
        description:
          "Use type=facebook for Facebook Page Messenger and type=instagram for Instagram Direct Messaging. Page ID and Instagram Business Account ID are optional metadata; sending replies depends on a valid access token.",
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: {
              type: "string",
              enum: ["facebook", "instagram", "whatsapp", "email", "phone", "zalo"],
              default: "instagram",
              example: "instagram",
            },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChannelConfigRequest" },
            },
          },
        },
        responses: { "200": { description: "Updated channel with sanitized config" } },
      },
      post: {
        tags: ["Settings"],
        summary: "Connect, disconnect, or test a channel",
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["facebook", "instagram", "whatsapp", "email", "phone", "zalo"] },
          },
        ],
        responses: { "200": { description: "Channel action result" } },
      },
    },
    "/webhooks/{id}/deliveries": {
      get: {
        tags: ["Webhooks"],
        summary: "List webhook deliveries with retry status",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["pending", "delivered", "failed"] },
          },
        ],
        responses: { "200": { description: "Paginated delivery list" } },
      },
      post: {
        tags: ["Webhooks"],
        summary: "Retry a failed delivery",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Retry result" } },
      },
    },
    "/settings": {
      get: {
        tags: ["Settings"],
        summary: "Get settings (secrets masked)",
        responses: { "200": { description: "Settings with masked sensitive fields" } },
      },
      put: {
        tags: ["Settings"],
        summary: "Update settings",
        responses: { "200": { description: "Updated settings" } },
      },
    },
    "/stats": {
      get: {
        tags: ["Analytics"],
        summary: "Get summary statistics",
        responses: { "200": { description: "Stats overview" } },
      },
    },
    "/analytics": {
      get: {
        tags: ["Analytics"],
        summary: "Get detailed analytics",
        parameters: [
          { name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d"] } },
        ],
        responses: { "200": { description: "Analytics data" } },
      },
    },
    "/export": {
      get: {
        tags: ["Analytics"],
        summary: "Export data (CSV/JSON)",
        parameters: [
          {
            name: "type",
            in: "query",
            schema: {
              type: "string",
              enum: ["conversations", "tickets", "customers", "knowledge"],
            },
          },
          { name: "format", in: "query", schema: { type: "string", enum: ["json", "csv"] } },
          { name: "limit", in: "query", schema: { type: "integer", maximum: 50000 } },
        ],
        responses: { "200": { description: "Exported data" } },
      },
    },
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check with service status",
        security: [],
        responses: {
          "200": { description: "Service health including database, Gemini, memory, uptime" },
        },
      },
    },
    "/openapi.json": {
      get: {
        tags: ["System"],
        summary: "OpenAPI specification",
        security: [],
        responses: { "200": { description: "This document" } },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "linhkienled1000-token" },
    },
    schemas: {
      PaginatedResponse: {
        type: "object",
        properties: {
          data: { type: "array", items: {} },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer" },
              limit: { type: "integer" },
              total: { type: "integer" },
              totalPages: { type: "integer" },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              requestId: { type: "string" },
              details: {},
            },
          },
        },
      },
      ChannelConfigRequest: {
        type: "object",
        required: ["type"],
        properties: {
          type: {
            type: "string",
            enum: ["facebook", "instagram", "whatsapp", "email", "phone", "zalo"],
          },
          isActive: { type: "boolean" },
          config: {
            oneOf: [
              { $ref: "#/components/schemas/FacebookChannelConfig" },
              { $ref: "#/components/schemas/InstagramChannelConfig" },
            ],
          },
        },
      },
      FacebookChannelConfig: {
        type: "object",
        properties: {
          verifyToken: {
            type: "string",
            description: "Webhook verify token used by Meta webhook verification.",
          },
          pageAccessToken: {
            type: "string",
            description: "Secret token used to send replies through the Facebook Page.",
          },
          pageId: {
            type: "string",
            description:
              "Optional Facebook Page ID for notes/config checks. This is not the app ID and not a customer PSID.",
          },
          graphVersion: { type: "string", example: "v25.0" },
          appSecret: {
            type: "string",
            description:
              "Optional in dev, recommended in production to verify x-hub-signature-256.",
          },
        },
      },
      InstagramChannelConfig: {
        type: "object",
        properties: {
          verifyToken: {
            type: "string",
            description: "Webhook verify token used by Meta webhook verification.",
          },
          accessToken: {
            type: "string",
            description: "Secret token used to send replies through Instagram Direct Messaging.",
          },
          businessAccountId: {
            type: "string",
            description: "Optional Instagram Business/Professional account ID.",
          },
          graphVersion: { type: "string", example: "v25.0" },
          appSecret: {
            type: "string",
            description:
              "Optional in dev, recommended in production to verify x-hub-signature-256.",
          },
        },
      },
      MetaFacebookWebhookPayload: {
        type: "object",
        properties: {
          object: { type: "string", example: "page" },
          entry: { type: "array", items: { type: "object" } },
        },
      },
      MetaInstagramWebhookPayload: {
        type: "object",
        properties: {
          object: { type: "string", example: "instagram" },
          entry: { type: "array", items: { type: "object" } },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

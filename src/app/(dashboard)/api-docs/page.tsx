"use client";

import { Header } from "@/components/layout/header";
import {
  Key,
  ChevronDown,
  ChevronRight,
  Send,
  Copy,
  Check,
  Loader2,
  MessageSquare,
  MessagesSquare,
  Ticket,
  BookOpen,
  Users,
  Webhook,
  Download,
  Heart,
} from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  requestBody?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseExample: any;
  params?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: string;
  }[];
  queryParams?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: string;
  }[];
  headers?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: string;
  }[];
}

interface ApiSection {
  id: string;
  name: string;
  icon: React.ElementType;
  endpoints: Endpoint[];
  notes?: string[];
  links?: { label: string; url: string }[];
  examples?: { label: string; data: unknown }[];
  guideGroups?: { title: string; items: string[] }[];
}

// ---------------------------------------------------------------------------
// API Sections Data
// ---------------------------------------------------------------------------

const apiSections: ApiSection[] = [
  {
    id: "chat",
    name: "Chat",
    icon: MessageSquare,
    endpoints: [
      {
        method: "POST",
        path: "/api/chat",
        description:
          "Send a message and get an AI-generated response. The AI uses your knowledge base and conversation history to generate relevant answers.",
        requestBody: {
          message: "How do I reset my password?",
          conversationId: "conv_abc123",
          channel: "web",
          customerName: "John Doe",
        },
        responseExample: {
          reply: "To reset your password, go to Settings > Security and click 'Reset Password'...",
          conversationId: "conv_abc123",
          messageId: "msg_xyz789",
        },
        params: [],
      },
    ],
  },
  {
    id: "conversations",
    name: "Conversations",
    icon: MessagesSquare,
    endpoints: [
      {
        method: "GET",
        path: "/api/conversations",
        description: "List all conversations with optional filtering by status or channel.",
        responseExample: [
          {
            id: "conv_abc123",
            channel: "web",
            customerName: "John Doe",
            status: "active",
            createdAt: "2026-04-01T10:00:00Z",
          },
        ],
        queryParams: [
          {
            name: "status",
            type: "string",
            required: false,
            description: "Filter by status: active, closed, archived",
          },
          {
            name: "channel",
            type: "string",
            required: false,
            description: "Filter by channel: web, whatsapp, email, phone",
          },
        ],
      },
      {
        method: "POST",
        path: "/api/conversations",
        description: "Create a new conversation.",
        requestBody: {
          channel: "web",
          customerName: "Jane Smith",
          customerContact: "jane@example.com",
        },
        responseExample: {
          id: "conv_def456",
          channel: "web",
          customerName: "Jane Smith",
          status: "active",
          createdAt: "2026-04-01T10:00:00Z",
        },
      },
      {
        method: "GET",
        path: "/api/conversations/:id",
        description: "Get a specific conversation with its messages.",
        responseExample: {
          id: "conv_abc123",
          channel: "web",
          customerName: "John Doe",
          status: "active",
          messages: [
            { id: "msg_1", role: "user", content: "Hello", createdAt: "2026-04-01T10:00:00Z" },
            {
              id: "msg_2",
              role: "assistant",
              content: "Hi! How can I help?",
              createdAt: "2026-04-01T10:00:01Z",
            },
          ],
        },
        params: [{ name: "id", type: "string", required: true, description: "Conversation ID" }],
      },
      {
        method: "PUT",
        path: "/api/conversations/:id",
        description: "Update a conversation's status, customer info, or metadata.",
        requestBody: {
          status: "closed",
          satisfaction: 5,
          summary: "Customer asked about password reset.",
        },
        responseExample: {
          id: "conv_abc123",
          status: "closed",
          satisfaction: 5,
          updatedAt: "2026-04-01T12:00:00Z",
        },
        params: [{ name: "id", type: "string", required: true, description: "Conversation ID" }],
      },
      {
        method: "DELETE",
        path: "/api/conversations/:id",
        description: "Delete a conversation and all its messages.",
        responseExample: { ok: true },
        params: [{ name: "id", type: "string", required: true, description: "Conversation ID" }],
      },
      {
        method: "POST",
        path: "/api/conversations/:id/messages",
        description: "Add a message to an existing conversation.",
        requestBody: {
          role: "user",
          content: "I need help with billing",
        },
        responseExample: {
          id: "msg_new123",
          conversationId: "conv_abc123",
          role: "user",
          content: "I need help with billing",
          createdAt: "2026-04-01T10:05:00Z",
        },
        params: [{ name: "id", type: "string", required: true, description: "Conversation ID" }],
      },
    ],
  },
  {
    id: "tickets",
    name: "Tickets",
    icon: Ticket,
    endpoints: [
      {
        method: "GET",
        path: "/api/tickets",
        description: "List all tickets with optional filtering.",
        responseExample: [
          {
            id: "tkt_abc123",
            title: "Login issue",
            status: "open",
            priority: "high",
            createdAt: "2026-04-01T10:00:00Z",
          },
        ],
        queryParams: [
          {
            name: "status",
            type: "string",
            required: false,
            description: "Filter by status: open, in_progress, resolved, closed",
          },
          {
            name: "priority",
            type: "string",
            required: false,
            description: "Filter by priority: low, medium, high, urgent",
          },
        ],
      },
      {
        method: "POST",
        path: "/api/tickets",
        description: "Create a new support ticket.",
        requestBody: {
          title: "Cannot access dashboard",
          description: "User reports 403 error when accessing the main dashboard.",
          priority: "high",
          departmentId: "dept_abc",
        },
        responseExample: {
          id: "tkt_new456",
          title: "Cannot access dashboard",
          status: "open",
          priority: "high",
          createdAt: "2026-04-01T10:00:00Z",
        },
      },
      {
        method: "GET",
        path: "/api/tickets/:id",
        description: "Get a specific ticket with related conversation and assignment details.",
        responseExample: {
          id: "tkt_abc123",
          title: "Login issue",
          status: "open",
          priority: "high",
          department: { id: "dept_1", name: "Engineering" },
          assignedTo: { id: "mem_1", name: "Alice" },
        },
        params: [{ name: "id", type: "string", required: true, description: "Ticket ID" }],
      },
      {
        method: "PUT",
        path: "/api/tickets/:id",
        description: "Update a ticket's status, priority, assignment, or resolution.",
        requestBody: {
          status: "resolved",
          resolution: "Fixed permission configuration for the user.",
        },
        responseExample: {
          id: "tkt_abc123",
          status: "resolved",
          resolution: "Fixed permission configuration for the user.",
          updatedAt: "2026-04-01T12:00:00Z",
        },
        params: [{ name: "id", type: "string", required: true, description: "Ticket ID" }],
      },
      {
        method: "DELETE",
        path: "/api/tickets/:id",
        description: "Delete a ticket permanently.",
        responseExample: { ok: true },
        params: [{ name: "id", type: "string", required: true, description: "Ticket ID" }],
      },
    ],
  },
  {
    id: "knowledge",
    name: "Knowledge Base",
    icon: BookOpen,
    endpoints: [
      {
        method: "GET",
        path: "/api/knowledge/categories",
        description: "List all knowledge base categories with entry counts.",
        responseExample: [
          { id: "cat_1", name: "FAQ", description: "Frequently asked questions", entryCount: 12 },
        ],
      },
      {
        method: "POST",
        path: "/api/knowledge/categories",
        description: "Create a new knowledge base category.",
        requestBody: {
          name: "Troubleshooting",
          description: "Common troubleshooting guides",
          icon: "wrench",
          color: "#E67E22",
        },
        responseExample: {
          id: "cat_new1",
          name: "Troubleshooting",
          description: "Common troubleshooting guides",
          createdAt: "2026-04-01T10:00:00Z",
        },
      },
      {
        method: "GET",
        path: "/api/knowledge/entries",
        description: "List knowledge base entries, optionally filtered by category.",
        responseExample: [
          {
            id: "entry_1",
            title: "How to reset password",
            content: "Go to Settings > Security...",
            categoryId: "cat_1",
            isActive: true,
          },
        ],
        queryParams: [
          {
            name: "categoryId",
            type: "string",
            required: false,
            description: "Filter by category ID",
          },
        ],
      },
      {
        method: "POST",
        path: "/api/knowledge/entries",
        description: "Create a new knowledge base entry.",
        requestBody: {
          categoryId: "cat_1",
          title: "How to update billing info",
          content: "Navigate to Account > Billing and click 'Update Payment Method'...",
          priority: 1,
        },
        responseExample: {
          id: "entry_new1",
          title: "How to update billing info",
          categoryId: "cat_1",
          isActive: true,
          createdAt: "2026-04-01T10:00:00Z",
        },
      },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    icon: Users,
    endpoints: [
      {
        method: "GET",
        path: "/api/settings",
        description: "Get the current application settings.",
        responseExample: {
          businessName: "Luna Women's Hair Studio",
          welcomeMessage:
            "Hello! Welcome to Luna Women's Hair Studio. Would you like help with pricing, hair consultations, or booking an appointment?",
          tone: "friendly",
          aiProvider: "gemini",
          aiModel: "gemini-2.5-flash",
        },
      },
      {
        method: "PUT",
        path: "/api/settings",
        description: "Update application settings. Only include the fields you want to change.",
        requestBody: {
          businessName: "Acme Support",
          welcomeMessage: "Welcome to Acme! How can we assist you?",
          tone: "professional",
        },
        responseExample: {
          businessName: "Acme Support",
          welcomeMessage: "Welcome to Acme! How can we assist you?",
          tone: "professional",
          updatedAt: "2026-04-01T12:00:00Z",
        },
      },
    ],
  },
  {
    id: "webhooks",
    name: "Webhooks",
    icon: Webhook,
    endpoints: [
      {
        method: "GET",
        path: "/api/webhooks",
        description: "List all configured webhooks.",
        responseExample: [
          {
            id: "wh_abc123",
            name: "Slack notifications",
            url: "https://hooks.slack.com/services/...",
            method: "POST",
            triggerOn: "ticket_created",
            isActive: true,
          },
        ],
      },
      {
        method: "POST",
        path: "/api/webhooks",
        description: "Create a new webhook.",
        requestBody: {
          name: "Slack notification",
          url: "https://hooks.slack.com/services/T00/B00/xxx",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          triggerOn: "ticket_created",
        },
        responseExample: {
          id: "wh_new456",
          name: "Slack notification",
          url: "https://hooks.slack.com/services/T00/B00/xxx",
          triggerOn: "ticket_created",
          isActive: true,
          createdAt: "2026-04-01T10:00:00Z",
        },
      },
    ],
  },
  {
    id: "meta-setup-guide",
    name: "Meta Setup Guide",
    icon: Key,
    notes: [
      "This guide is for admins or customers who need to connect Facebook Messenger and Instagram Direct Messaging for the first time.",
      "Both Facebook and Instagram use the same callback URL in CSKH-SALON: <APP_ORIGIN>/api/webhooks/meta.",
      "Use this guide to understand what each key/token is, where it comes from, and where to paste it in Settings.",
      "Meta Dashboard screens may change. Use the official Meta docs links as the source of truth for exact button names and review requirements.",
      "Never paste real access tokens or app secrets into chat, screenshots, public docs, logs, or Git commits.",
    ],
    guideGroups: [
      {
        title: "1. Before you start",
        items: [
          "Confirm the business has a Facebook Page for Messenger. A personal Facebook profile is not enough for this integration.",
          "Confirm the business has an Instagram Business or Creator account for Instagram Direct Messaging.",
          "Make sure the person doing setup has admin/manage access to the Meta App, Facebook Page, and Instagram account.",
          "Prepare the public app URL. In production this is the customer domain; in local testing use a public HTTPS tunnel such as ngrok.",
          "Decide one Verify Token string, for example my-salon-meta-verify-token. This is not provided by Meta; you create it and paste the same value into CSKH-SALON and Meta Dashboard.",
          "Facebook and Instagram can use the same Verify Token for simplicity, or separate Verify Tokens if configured separately. The value entered in Meta Dashboard must match the value saved in the corresponding CSKH-SALON channel settings.",
          "Keep Page Access Token, Instagram Access Token, and App Secret private. Do not send real values in chat, screenshots, public docs, or commits.",
        ],
      },
      {
        title: "2. Understand what each Meta value means",
        items: [
          "Meta Developer App: the container in developers.facebook.com where products, webhook callback, app secret, and permissions are configured.",
          "Facebook Page: the public page customers message through Messenger. It is different from the Meta Developer App.",
          "Instagram Business or Creator Account: the Instagram account customers message through Direct Messaging.",
          "Callback URL: the CSKH-SALON webhook URL Meta calls. Use <APP_ORIGIN>/api/webhooks/meta for both Facebook and Instagram.",
          "Verify Token: a shared text value used only when Meta verifies the callback URL. CSKH-SALON checks hub.verify_token against this value.",
          "Access Token: the secret credential CSKH-SALON uses to send replies back to Facebook or Instagram.",
          "App Secret: the Meta App secret used to validate x-hub-signature-256 on webhook POST requests.",
          "Graph Version: the Meta Graph API version used for send/config calls, for example v25.0.",
        ],
      },
      {
        title: "3. Where to paste in CSKH-SALON",
        items: [
          "Settings -> Facebook -> Verify Token.",
          "Settings -> Facebook -> Page Access Token.",
          "Settings -> Facebook -> Page ID, optional.",
          "Settings -> Facebook -> Graph Version.",
          "Settings -> Facebook -> App Secret, optional but recommended in production.",
          "Settings -> Instagram -> Verify Token.",
          "Settings -> Instagram -> Access Token.",
          "Settings -> Instagram -> Business Account ID, optional.",
          "Settings -> Instagram -> Graph Version.",
          "Settings -> Instagram -> App Secret, optional but recommended in production.",
        ],
      },
      {
        title: "4. Create or choose the Meta Developer App",
        items: [
          "Open Meta for Developers, then open Apps. If the customer already has a Meta App, use that app instead of creating a duplicate.",
          "Create an app only if there is no suitable existing app for this business.",
          "Inside the app, add or configure the Messenger product for Facebook Messenger.",
          "Inside the same app, add or configure the Instagram product/API flow for Instagram Direct Messaging.",
          "Open App settings and copy the App Secret only if CSKH-SALON will verify webhook signatures in this environment.",
          "Do not confuse App ID with Page ID. App ID identifies the Meta Developer App; Page ID identifies the Facebook Page.",
        ],
      },
      {
        title: "5. Prepare the Facebook Page",
        items: [
          "Create or choose the Facebook Page that customers will message.",
          "Confirm the setup user can manage the Page in Meta/Facebook business tools.",
          "If the Page is new, finish basic Page setup first: name, category, contact info, and Messenger availability.",
          "In Meta Dashboard, select this Page when configuring the Messenger product.",
          "Optional Page ID can be copied from Page settings or looked up with Graph API after you have a Page Access Token.",
        ],
      },
      {
        title: "6. Get the Facebook Page Access Token",
        items: [
          "In the Meta Developer App, open the Messenger or Messenger API setup area.",
          "Select the Facebook Page that CSKH-SALON should reply from.",
          "Generate or copy the Page Access Token for that Page.",
          "Paste it into CSKH-SALON Settings -> Facebook -> Page Access Token.",
          "Optional Page ID lookup: call https://graph.facebook.com/v25.0/me?fields=id,name&access_token=YOUR_FACEBOOK_PAGE_ACCESS_TOKEN and use the returned id.",
          "If the token later returns 401 or 403, regenerate it or check permissions/app mode/review in Meta Dashboard.",
        ],
      },
      {
        title: "7. Configure Facebook Messenger webhook",
        items: [
          "In CSKH-SALON Settings -> Facebook, fill Verify Token, Page Access Token, Graph Version, optional Page ID, and optional App Secret.",
          "Save the Facebook channel config before testing Meta verification.",
          "In Meta Dashboard webhook settings, set Callback URL to <APP_ORIGIN>/api/webhooks/meta.",
          "Set Verify Token in Meta Dashboard to exactly the same value saved in CSKH-SALON.",
          "Subscribe the Facebook Page/webhook to the Messenger message events required by the app.",
          "Send a real message to the Facebook Page and confirm CSKH-SALON creates a conversation with channel=facebook.",
        ],
      },
      {
        title: "8. Prepare the Instagram account",
        items: [
          "Use an Instagram Business or Creator account according to Meta's current requirements.",
          "Confirm the setup user can manage the Instagram account and any related business assets required by Meta.",
          "Use Instagram API with Instagram Login / Direct Messaging. Instagram Basic Display API is not enough for chatbot messaging.",
          "If the account is new or not eligible, complete Meta's account/business setup first before connecting CSKH-SALON.",
          "Do not reuse a Facebook Page Access Token as the Instagram Access Token for this direct Instagram flow.",
        ],
      },
      {
        title: "9. Get the Instagram Access Token",
        items: [
          "In the Meta Developer App, open the Instagram API with Instagram Login setup flow.",
          "Configure the app/account according to Meta's Instagram Direct Messaging requirements.",
          "Complete the authorization/login step for the Instagram account that should receive messages.",
          "Copy the Instagram Access Token produced by that flow.",
          "Paste it into CSKH-SALON Settings -> Instagram -> Access Token.",
          "Optional Business Account ID is metadata for checking/debugging. Webhook recipient.id can also help confirm which Instagram account received a message.",
        ],
      },
      {
        title: "10. Configure Instagram Direct Messaging webhook",
        items: [
          "In CSKH-SALON Settings -> Instagram, fill Verify Token, Access Token, Graph Version, optional Business Account ID, and optional App Secret.",
          "Save the Instagram channel config before testing Meta verification.",
          "In Meta Dashboard webhook settings, use the same shared callback URL: <APP_ORIGIN>/api/webhooks/meta.",
          "Set Verify Token in Meta Dashboard to exactly the same value saved in CSKH-SALON.",
          "Subscribe the required Instagram messaging/webhook events in Meta Dashboard.",
          "Send a real DM to the Instagram account and confirm CSKH-SALON creates a conversation with channel=instagram.",
        ],
      },
      {
        title: "11. Production note",
        items: [
          "In development mode, only admins, developers, or testers may be able to interact with the Meta App.",
          "If internal testers can send messages but real customers cannot, check Meta App Review, required permissions, app mode, and business verification requirements.",
          "Before going live for a customer, review the official Meta docs for the current permission and review requirements for Messenger and Instagram Direct Messaging.",
          "Do not treat a successful local webhook test as full production approval. It only proves CSKH-SALON can receive the payload shape.",
        ],
      },
      {
        title: "12. How to know setup is working",
        items: [
          "Meta webhook verification succeeds when Meta sends hub.mode=subscribe and CSKH-SALON returns hub.challenge as plain text.",
          "Facebook test succeeds when a Messenger message creates or updates a conversation with channel=facebook.",
          "Instagram test succeeds when an Instagram DM creates or updates a conversation with channel=instagram.",
          "Channel config checks should show hasPageAccessToken/hasAccessToken and hasAppSecret without exposing raw secret values.",
          "If AI reply is not sent, check both channel delivery config and the AI provider/API key config. Webhook receive and chatbot reply are two separate steps.",
        ],
      },
      {
        title: "13. Common troubleshooting",
        items: [
          "Webhook verify fails: check callback URL, public HTTPS access, exact Verify Token match, and whether the app server is running.",
          "Webhook receives Facebook payload in Instagram docs: use only the shared webhook Try it endpoint; platform examples are documentation-only examples.",
          "Bot does not reply: check the access token, channel config, AI provider/API key, and server logs.",
          "401 or 403 from Meta: token may be expired, missing permission, blocked by app mode/review, or tied to the wrong account/page.",
          "Facebook Page ID is empty: acceptable if the Page Access Token works with /me/messages.",
          "Instagram token does not work: confirm it is from the Instagram API with Instagram Login / Direct Messaging flow, not Basic Display API.",
          "If any token is exposed, rotate or revoke it in Meta Developer Dashboard and update CSKH-SALON Settings.",
        ],
      },
      {
        title: "14. When to open the official Meta docs",
        items: [
          "Open Messenger Platform docs when creating/configuring the Facebook Messenger product.",
          "Open Messenger Webhooks docs when choosing webhook fields/events and verifying callback behavior.",
          "Open Messenger Send API docs when debugging Facebook outbound replies.",
          "Open Instagram Platform docs when checking account eligibility and Instagram API requirements.",
          "Open Instagram API with Instagram Login docs when generating or validating Instagram access tokens.",
          "Open Graph API Webhooks docs when Meta changes webhook dashboard screens or verification wording.",
        ],
      },
    ],
    links: [
      {
        label: "Meta for Developers Apps",
        url: "https://developers.facebook.com/apps/",
      },
      {
        label: "Graph API Webhooks",
        url: "https://developers.facebook.com/docs/graph-api/webhooks",
      },
      {
        label: "Messenger Platform",
        url: "https://developers.facebook.com/docs/messenger-platform",
      },
      {
        label: "Messenger Webhooks",
        url: "https://developers.facebook.com/docs/messenger-platform/webhooks",
      },
      {
        label: "Messenger Send API",
        url: "https://developers.facebook.com/docs/messenger-platform/send-messages",
      },
      {
        label: "Instagram Platform",
        url: "https://developers.facebook.com/docs/instagram-platform",
      },
      {
        label: "Instagram API with Instagram Login",
        url: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login",
      },
      {
        label: "Instagram API Get Started",
        url: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started",
      },
      {
        label: "Business Login for Instagram",
        url: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login",
      },
    ],
    endpoints: [],
  },
  {
    id: "meta-shared-webhook",
    name: "Meta Shared Webhook",
    icon: Webhook,
    notes: [
      "Scope: this section is the API reference for the shared Meta callback. For key/token setup steps, start from Meta Setup Guide.",
      "Callback URL: Facebook Messenger and Instagram Direct Messaging share <APP_ORIGIN>/api/webhooks/meta.",
      "Shared flow: Meta webhook -> parse payload -> detect platform -> resolveCustomer -> find/create Conversation -> chat(conversation.id, text) -> send reply.",
      "Platform detection: Facebook uses object=page; Instagram uses object=instagram.",
      "Supported events: currently supported = text messages. Ignored = echo, non-text, delivery/read receipts, and reactions.",
      "Security: x-hub-signature-256 is verified when META_APP_SECRET or a channel appSecret is configured.",
      "Webhook verification: GET verification uses hub.mode=subscribe, hub.verify_token, and hub.challenge.",
      "Try it note: POST Try it uses a Facebook object=page payload only as a runnable sample. Copy Instagram payloads from the Instagram Direct Messaging section.",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api/webhooks/meta",
        description:
          "Verify the shared Meta webhook callback for Facebook Messenger and Instagram Direct Messaging. If hub.mode is subscribe and hub.verify_token matches Settings > Facebook/Instagram or META_VERIFY_TOKEN, the route returns hub.challenge as plain text.",
        queryParams: [
          {
            name: "hub.mode",
            type: "string",
            required: true,
            description:
              "Always use subscribe. Meta sends this value when verifying the webhook callback.",
            defaultValue: "subscribe",
          },
          {
            name: "hub.verify_token",
            type: "string",
            required: true,
            description: "Webhook verify token from Settings > Facebook/Instagram or META_VERIFY_TOKEN.",
          },
          {
            name: "hub.challenge",
            type: "string",
            required: true,
            description: "Challenge string returned as text when verification succeeds.",
            defaultValue: "hello123",
          },
        ],
        responseExample: "hello123",
      },
      {
        method: "POST",
        path: "/api/webhooks/meta",
        description:
          "Receive the shared Meta webhook callback. The request body shown here is a real Facebook payload for Try it convenience; see the Facebook Messenger and Instagram Direct Messaging sections for separate platform-specific payload examples.",
        requestBody: {
          object: "page",
          entry: [
            {
              messaging: [
                {
                  sender: { id: "USER_PSID_TEST" },
                  recipient: { id: "PAGE_ID_TEST" },
                  message: { text: "hello facebook" },
                },
              ],
            },
          ],
        },
        responseExample: { ok: true, received: 1 },
        params: [],
        headers: [
          {
            name: "x-hub-signature-256",
            type: "header",
            required: false,
            description:
              "Required when META_APP_SECRET or a channel appSecret is configured. Invalid signatures return 401.",
          },
        ],
      },
    ],
  },
  {
    id: "facebook-messenger",
    name: "Facebook Messenger",
    icon: MessageSquare,
    notes: [
      "Scope: this section documents Facebook channel config APIs and Facebook payload examples. For step-by-step setup and where to paste values, use Meta Setup Guide.",
      "Required config: Verify Token, Page Access Token, Graph Version v25.0, and optional Page ID/App Secret.",
      "Page ID lookup, optional: curl \"https://graph.facebook.com/v25.0/me?fields=id,name&access_token=YOUR_FACEBOOK_PAGE_ACCESS_TOKEN\". The id in the response is the Page ID. Do not paste real tokens into shared logs.",
      "Facebook payload mapping: sender.id -> customer PSID, recipient.id -> Facebook Page ID, customerContact -> facebook:<psid>.",
      "Security: GET channel responses never return raw pageAccessToken or appSecret. Blank or masked secret fields preserve the existing secret on save.",
      "Local POST test: curl -X POST \"http://localhost:3000/api/webhooks/meta\" -H \"Content-Type: application/json\" -d \"{\\\"object\\\":\\\"page\\\",\\\"entry\\\":[{\\\"messaging\\\":[{\\\"sender\\\":{\\\"id\\\":\\\"USER_PSID_TEST\\\"},\\\"recipient\\\":{\\\"id\\\":\\\"PAGE_ID_TEST\\\"},\\\"message\\\":{\\\"text\\\":\\\"hello facebook\\\"}}]}]}\"",
    ],
    examples: [
      {
        label: "Facebook Webhook Payload",
        data: {
          object: "page",
          entry: [
            {
              messaging: [
                {
                  sender: { id: "USER_PSID" },
                  recipient: { id: "PAGE_ID" },
                  message: { text: "Hello from Facebook" },
                },
              ],
            },
          ],
        },
      },
      {
        label: "Facebook Channel Config",
        data: {
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
    ],
    links: [
      {
        label: "Messenger Platform",
        url: "https://developers.facebook.com/docs/messenger-platform",
      },
      {
        label: "Messenger Webhooks",
        url: "https://developers.facebook.com/docs/messenger-platform/webhooks",
      },
      {
        label: "Messenger Send API",
        url: "https://developers.facebook.com/docs/messenger-platform/send-messages",
      },
      {
        label: "Graph API Webhooks",
        url: "https://developers.facebook.com/docs/graph-api/webhooks",
      },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api/channels/:type",
        description:
          "Get sanitized Facebook channel config. Use type=facebook. Raw pageAccessToken and appSecret are never returned.",
        params: [
          {
            name: "type",
            type: "string",
            required: true,
            description: "Use facebook.",
            defaultValue: "facebook",
          },
        ],
        responseExample: {
          type: "facebook",
          isActive: true,
          config: {
            verifyToken: "my-verify-token",
            pageId: "OPTIONAL_PAGE_ID",
            graphVersion: "v25.0",
            hasPageAccessToken: true,
            hasAppSecret: true,
          },
        },
      },
      {
        method: "POST",
        path: "/api/channels",
        description:
          "Create or update Facebook channel config. Blank or masked pageAccessToken/appSecret values preserve existing secrets.",
        requestBody: {
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
        responseExample: {
          type: "facebook",
          isActive: true,
          config: {
            verifyToken: "my-verify-token",
            pageId: "OPTIONAL_PAGE_ID",
            graphVersion: "v25.0",
            hasPageAccessToken: true,
            hasAppSecret: true,
          },
        },
      },
    ],
  },
  {
    id: "instagram-direct",
    name: "Instagram Direct Messaging",
    icon: MessagesSquare,
    notes: [
      "Scope: this section documents Instagram channel config APIs and Instagram payload examples. For step-by-step setup and where to paste values, use Meta Setup Guide.",
      "Required config: Verify Token, Instagram Access Token, Graph Version v25.0, and optional Business Account ID/App Secret.",
      "Important: this integration targets Instagram Direct Messaging API / Instagram API with Instagram Login.",
      "Do not use Instagram Basic Display API for chatbot messaging.",
      "Do not use a Facebook Page Access Token as the Instagram Access Token for the direct Instagram flow.",
      "Business Account ID: optional metadata in CSKH-SALON. The webhook payload recipient.id can help confirm which Instagram business/account received the message.",
      "Instagram payload mapping: sender.id -> Instagram sender id, recipient.id -> Instagram business/account id, customerContact -> instagram:<sender_id>.",
      "Security: GET channel responses never return raw accessToken or appSecret. Blank or masked secret fields preserve the existing secret on save.",
      "Local POST test: curl -X POST \"http://localhost:3000/api/webhooks/meta\" -H \"Content-Type: application/json\" -d \"{\\\"object\\\":\\\"instagram\\\",\\\"entry\\\":[{\\\"messaging\\\":[{\\\"sender\\\":{\\\"id\\\":\\\"IG_SENDER_TEST\\\"},\\\"recipient\\\":{\\\"id\\\":\\\"IG_BUSINESS_TEST\\\"},\\\"message\\\":{\\\"text\\\":\\\"hello instagram\\\"}}]}]}\"",
    ],
    examples: [
      {
        label: "Instagram Webhook Payload",
        data: {
          object: "instagram",
          entry: [
            {
              messaging: [
                {
                  sender: { id: "IG_SENDER_ID" },
                  recipient: { id: "IG_BUSINESS_ID" },
                  message: { text: "Hello from Instagram" },
                },
              ],
            },
          ],
        },
      },
      {
        label: "Instagram Channel Config",
        data: {
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
    ],
    links: [
      {
        label: "Instagram Platform",
        url: "https://developers.facebook.com/docs/instagram-platform",
      },
      {
        label: "Instagram API with Instagram Login",
        url: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login",
      },
      {
        label: "Business Login for Instagram",
        url: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login",
      },
      {
        label: "Instagram API Get Started",
        url: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started",
      },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api/channels/:type",
        description:
          "Get sanitized Instagram channel config. Use type=instagram. Raw accessToken and appSecret are never returned.",
        params: [
          {
            name: "type",
            type: "string",
            required: true,
            description: "Use instagram.",
            defaultValue: "instagram",
          },
        ],
        responseExample: {
          type: "instagram",
          isActive: true,
          config: {
            verifyToken: "my-verify-token",
            businessAccountId: "OPTIONAL_INSTAGRAM_BUSINESS_ACCOUNT_ID",
            graphVersion: "v25.0",
            hasAccessToken: true,
            hasAppSecret: true,
          },
        },
      },
      {
        method: "PUT",
        path: "/api/channels/:type",
        description:
          "Update Instagram channel config. Blank or masked accessToken/appSecret values preserve existing secrets.",
        params: [
          {
            name: "type",
            type: "string",
            required: true,
            description: "Use instagram.",
            defaultValue: "instagram",
          },
        ],
        requestBody: {
          isActive: true,
          config: {
            verifyToken: "my-verify-token",
            accessToken: "YOUR_INSTAGRAM_ACCESS_TOKEN",
            businessAccountId: "OPTIONAL_INSTAGRAM_BUSINESS_ACCOUNT_ID",
            graphVersion: "v25.0",
            appSecret: "YOUR_META_APP_SECRET",
          },
        },
        responseExample: {
          type: "instagram",
          isActive: true,
          config: {
            verifyToken: "my-verify-token",
            businessAccountId: "OPTIONAL_INSTAGRAM_BUSINESS_ACCOUNT_ID",
            graphVersion: "v25.0",
            hasAccessToken: true,
            hasAppSecret: true,
          },
        },
      },
    ],
  },
  {
    id: "export",
    name: "Export",
    icon: Download,
    endpoints: [
      {
        method: "GET",
        path: "/api/export",
        description:
          "Export data in CSV or JSON format. Supports exporting conversations, tickets, knowledge base entries, and customers.",
        responseExample: {
          note: "Returns CSV or JSON file as download",
        },
        queryParams: [
          {
            name: "type",
            type: "string",
            required: true,
            description: "Data type: conversations, tickets, knowledge, customers",
          },
          {
            name: "format",
            type: "string",
            required: true,
            description: "Output format: csv or json",
          },
        ],
      },
    ],
  },
  {
    id: "health",
    name: "Health Check",
    icon: Heart,
    endpoints: [
      {
        method: "GET",
        path: "/api/health",
        description:
          "Check the API health status. Returns uptime and database connectivity status.",
        responseExample: {
          status: "ok",
          uptime: 86400,
          database: "connected",
          timestamp: "2026-04-01T10:00:00Z",
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Method Badge
// ---------------------------------------------------------------------------

const methodColors: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  POST: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  PUT: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide min-w-[56px] justify-center",
        methodColors[method] || "bg-gray-100 text-gray-800"
      )}
    >
      {method}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Code Block
// ---------------------------------------------------------------------------

function CodeBlock({ data, label }: { data: unknown; label: string }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(data, null, 2);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 rounded-t-lg border border-gray-700">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 text-sm p-4 rounded-b-lg border border-t-0 border-gray-700 overflow-x-auto">
        <code>{text}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Try It Panel
// ---------------------------------------------------------------------------

function TryItPanel({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const allParams = useMemo(
    () => [...(endpoint.params || []), ...(endpoint.queryParams || [])],
    [endpoint.params, endpoint.queryParams]
  );
  const getDefaultParamValues = useCallback(() => {
    return allParams.reduce<Record<string, string>>((values, param) => {
      if (param.defaultValue) values[param.name] = param.defaultValue;
      return values;
    }, {});
  }, [allParams]);
  const [paramValues, setParamValues] = useState<Record<string, string>>(getDefaultParamValues);
  const [bodyText, setBodyText] = useState(
    endpoint.requestBody ? JSON.stringify(endpoint.requestBody, null, 2) : ""
  );

  useEffect(() => {
    setParamValues(getDefaultParamValues());
    setBodyText(endpoint.requestBody ? JSON.stringify(endpoint.requestBody, null, 2) : "");
    setResponse(null);
    setResponseStatus(null);
  }, [endpoint, getDefaultParamValues]);

  const handleSend = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    setResponseStatus(null);

    try {
      let url = endpoint.path;

      // Replace path params
      if (endpoint.params) {
        for (const p of endpoint.params) {
          url = url.replace(`:${p.name}`, paramValues[p.name] || `{${p.name}}`);
        }
      }

      // Add query params
      if (endpoint.queryParams) {
        const qp = new URLSearchParams();
        for (const p of endpoint.queryParams) {
          if (paramValues[p.name]) qp.set(p.name, paramValues[p.name]);
        }
        const qs = qp.toString();
        if (qs) url += `?${qs}`;
      }

      const opts: RequestInit = {
        method: endpoint.method,
        headers: { "Content-Type": "application/json" },
      };

      if ((endpoint.method === "POST" || endpoint.method === "PUT") && bodyText.trim()) {
        opts.body = bodyText;
      }

      const res = await fetch(url, opts);
      setResponseStatus(res.status);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        const json = await res.json();
        setResponse(JSON.stringify(json, null, 2));
      } else {
        const text = await res.text();
        setResponse(text.slice(0, 2000));
      }
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : "Request failed"}`);
    } finally {
      setLoading(false);
    }
  }, [endpoint, paramValues, bodyText]);

  return (
    <div className="mt-4 border border-owly-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-owly-text bg-owly-primary-50 hover:bg-owly-primary-100 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-owly-primary" />
        ) : (
          <ChevronRight className="h-4 w-4 text-owly-primary" />
        )}
        <Send className="h-4 w-4 text-owly-primary" />
        Try it
      </button>

      {open && (
        <div className="p-4 space-y-4 bg-owly-surface border-t border-owly-border">
          {allParams.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-owly-text-light uppercase tracking-wider">
                Parameters
              </h4>
              {allParams.map((p) => (
                <div key={p.name} className="flex items-start gap-3">
                  <div className="w-40 flex-shrink-0">
                    <label className="text-sm font-medium text-owly-text">
                      {p.name}
                      {p.required && <span className="text-owly-danger ml-0.5">*</span>}
                    </label>
                    <p className="text-xs text-owly-text-light">{p.type}</p>
                  </div>
                  <input
                    type="text"
                    placeholder={p.description}
                    className="flex-1 px-3 py-1.5 text-sm border border-owly-border rounded-lg bg-owly-bg text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-theme"
                    value={paramValues[p.name] || ""}
                    onChange={(e) => setParamValues({ ...paramValues, [p.name]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}

          {(endpoint.method === "POST" || endpoint.method === "PUT") && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-owly-text-light uppercase tracking-wider">
                Request Body (JSON)
              </h4>
              <textarea
                className="w-full h-40 px-3 py-2 text-sm font-mono border border-owly-border rounded-lg bg-owly-bg text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary resize-y transition-theme"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
              />
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-owly-primary text-white text-sm font-medium rounded-lg hover:bg-owly-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Request
          </button>

          {response !== null && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-owly-text-light uppercase tracking-wider">
                  Response
                </span>
                {responseStatus !== null && (
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded",
                      responseStatus >= 200 && responseStatus < 300
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    )}
                  >
                    {responseStatus}
                  </span>
                )}
              </div>
              <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 text-sm p-4 rounded-lg border border-gray-700 overflow-x-auto max-h-80">
                <code>{response}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Endpoint Card
// ---------------------------------------------------------------------------

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div className="border border-owly-border rounded-xl bg-owly-surface p-6 transition-theme">
      <div className="flex items-center gap-3 flex-wrap">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-semibold text-owly-text font-mono">{endpoint.path}</code>
      </div>

      <p className="mt-3 text-sm text-owly-text-light leading-relaxed">{endpoint.description}</p>

      {/* Parameters table */}
      {((endpoint.params && endpoint.params.length > 0) ||
        (endpoint.queryParams && endpoint.queryParams.length > 0) ||
        (endpoint.headers && endpoint.headers.length > 0)) && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-owly-text-light uppercase tracking-wider mb-2">
            Parameters
          </h4>
          <div className="border border-owly-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-owly-bg">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-owly-text-light uppercase">
                    Name
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-owly-text-light uppercase">
                    Type
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-owly-text-light uppercase">
                    Required
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-owly-text-light uppercase">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...(endpoint.params || []), ...(endpoint.queryParams || []), ...(endpoint.headers || [])].map((p) => (
                  <tr key={p.name} className="border-t border-owly-border">
                    <td className="px-4 py-2 font-mono text-owly-text font-medium">{p.name}</td>
                    <td className="px-4 py-2 text-owly-text-light">{p.type}</td>
                    <td className="px-4 py-2">
                      {p.required ? (
                        <span className="text-owly-danger font-medium">Yes</span>
                      ) : (
                        <span className="text-owly-text-light">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-owly-text-light">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request body */}
      {endpoint.requestBody && (
        <div className="mt-4">
          <CodeBlock data={endpoint.requestBody} label="Request Body" />
        </div>
      )}

      {/* Response example */}
      <div className="mt-4">
        <CodeBlock data={endpoint.responseExample} label="Response" />
      </div>

      {/* Try it */}
      <TryItPanel endpoint={endpoint} />
    </div>
  );
}

function GuideNote({ note }: { note: string }) {
  const separatorIndex = note.indexOf(":");
  const hasPrefix = separatorIndex > 0 && separatorIndex <= 48;

  if (!hasPrefix) return <span>{note}</span>;

  return (
    <span>
      <span className="font-medium text-owly-text">{note.slice(0, separatorIndex)}:</span>
      {note.slice(separatorIndex + 1)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState("chat");

  const currentSection = apiSections.find((s) => s.id === activeSection) || apiSections[0];

  return (
    <div className="flex flex-col h-full">
      <Header title="API Documentation" description="Integrate SalonDesk with your systems" />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-60 flex-shrink-0 border-r border-owly-border bg-owly-bg overflow-y-auto p-4 hidden lg:block">
          <nav className="space-y-1">
            {apiSections.map((section) => {
              const Icon = section.icon;
              const isActive = section.id === activeSection;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                    isActive
                      ? "bg-owly-primary text-white"
                      : "text-owly-text-light hover:bg-owly-surface hover:text-owly-text"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {section.name}
                  <span className="ml-auto text-xs opacity-70">
                    {section.endpoints.length || (section.guideGroups ? "Guide" : 0)}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Mobile section selector */}
            <div className="lg:hidden">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                className="w-full px-3 py-2 border border-owly-border rounded-lg bg-owly-surface text-owly-text text-sm focus:outline-none focus:ring-2 focus:ring-owly-primary/30"
              >
                {apiSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Authentication Section */}
            <div className="border border-owly-border rounded-xl bg-owly-surface p-6 transition-theme">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-owly-primary-50 rounded-lg">
                  <Key className="h-5 w-5 text-owly-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-owly-text">Authentication</h3>
                  <p className="text-sm text-owly-text-light">
                    All API requests require authentication
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-owly-text-light leading-relaxed">
                <p>
                  Include your API key in the request headers using the{" "}
                  <code className="px-1.5 py-0.5 bg-owly-bg rounded text-owly-text font-mono text-xs">
                    X-API-Key
                  </code>{" "}
                  header. You can generate and manage API keys from the{" "}
                  <span className="font-medium text-owly-text">Settings</span> page.
                </p>
                <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 text-sm p-4 rounded-lg border border-gray-700 font-mono">
                  <span className="text-blue-400">curl</span>{" "}
                  <span className="text-green-400">-H</span>{" "}
                  <span className="text-amber-300">{'"X-API-Key: your_api_key_here"'}</span> \<br />
                  {"  "}https://your-domain.com/api/conversations
                </div>
                <p>
                  API keys can be configured with different permissions. Keep your keys secure and
                  never expose them in client-side code. If a key is compromised, revoke it
                  immediately from the Settings page and generate a new one.
                </p>
              </div>
            </div>

            {/* Section Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-owly-primary-50 rounded-lg">
                <currentSection.icon className="h-5 w-5 text-owly-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-owly-text">{currentSection.name}</h3>
                <p className="text-sm text-owly-text-light">
                  {currentSection.endpoints.length > 0
                    ? `${currentSection.endpoints.length} endpoint${
                        currentSection.endpoints.length !== 1 ? "s" : ""
                      }`
                    : "Integration guide"}
                </p>
              </div>
            </div>

            {/* Endpoints */}
            {(currentSection.notes ||
              currentSection.guideGroups ||
              currentSection.examples ||
              currentSection.links) && (
              <div className="border border-owly-border rounded-xl bg-owly-surface p-6 transition-theme space-y-4">
                {currentSection.notes && (
                  <div>
                    <h4 className="text-xs font-semibold text-owly-text-light uppercase tracking-wider mb-2">
                      Notes
                    </h4>
                    <ul className="space-y-2 text-sm text-owly-text-light leading-relaxed">
                      {currentSection.notes.map((note) => (
                        <li key={note} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-owly-primary flex-shrink-0" />
                          <GuideNote note={note} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentSection.guideGroups && (
                  <div>
                    <h4 className="text-xs font-semibold text-owly-text-light uppercase tracking-wider mb-3">
                      Integration Guide
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {currentSection.guideGroups.map((group) => (
                        <div
                          key={group.title}
                          className="rounded-lg border border-owly-border bg-owly-bg/50 p-4"
                        >
                          <h5 className="text-sm font-semibold text-owly-text mb-3">
                            {group.title}
                          </h5>
                          <ol className="space-y-2 text-sm text-owly-text-light leading-relaxed">
                            {group.items.map((item, index) => (
                              <li key={item} className="flex gap-3">
                                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-owly-primary-50 text-xs font-semibold text-owly-primary">
                                  {index + 1}
                                </span>
                                <GuideNote note={item} />
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentSection.examples && (
                  <div>
                    <h4 className="text-xs font-semibold text-owly-text-light uppercase tracking-wider mb-2">
                      Examples
                    </h4>
                    <div className="space-y-4">
                      {currentSection.examples.map((example) => (
                        <CodeBlock
                          key={example.label}
                          data={example.data}
                          label={example.label}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentSection.links && (
                  <div>
                    <h4 className="text-xs font-semibold text-owly-text-light uppercase tracking-wider mb-2">
                      Official Meta Docs
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {currentSection.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-owly-primary hover:text-owly-primary-dark hover:underline transition-colors"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-6">
              {currentSection.endpoints.map((ep, i) => (
                <EndpointCard key={`${ep.method}-${ep.path}-${i}`} endpoint={ep} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

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
    id: "channel-readiness-matrix",
    name: "Channel Readiness Matrix",
    icon: Check,
    notes: [
      "This matrix is the high-level truth for lead/customer discussion. It separates implemented code from production readiness.",
      "Authorized is not the same as production-ready. Connected is not proof that a real customer can receive a bot reply.",
      "Any marketplace or social channel should pass a real end-to-end test before being called production-ready.",
    ],
    guideGroups: [
      {
        title: "Web widget / API",
        items: [
          "Runtime status: available through /api/chat and public widget/API flows.",
          "Inbound support: available for website/API/direct chat requests.",
          "Outbound support: internal response returned to caller; no external platform credential needed.",
          "Auth/config support: API key or app session depending on caller.",
          "Needs real credential: no platform credential needed beyond app deployment/auth.",
          "Production readiness: ready if deployment, AI provider, Knowledge Base, rate-limit, and monitoring are stable.",
        ],
      },
      {
        title: "Facebook Messenger",
        items: [
          "Runtime status: available in current Meta webhook/send flow.",
          "Inbound support: shared Meta webhook /api/webhooks/meta handles Facebook page messages.",
          "Outbound support: available through Meta send API when page token and permissions are valid.",
          "Auth/config support: verify token, page access token, page id, app secret, graph version.",
          "Needs real credential: Meta app, Facebook Page admin access, page token, webhook verification.",
          "Production readiness: near-ready after real Meta E2E, app review/permissions, signature verification, and no-secret logging checks.",
        ],
      },
      {
        title: "Instagram Direct Messaging",
        items: [
          "Runtime status: available via the shared Meta flow.",
          "Inbound support: shared Meta webhook /api/webhooks/meta handles Instagram messaging payloads.",
          "Outbound support: available when Instagram access token, permissions, and account eligibility are valid.",
          "Auth/config support: verify token, Instagram access token, business/account id, app secret, graph version.",
          "Needs real credential: Instagram Business/Creator account, Meta app permissions, Instagram messaging access.",
          "Production readiness: near-ready after real Instagram E2E and Meta review/permission checks.",
        ],
      },
      {
        title: "Zalo Python relay",
        items: [
          "Runtime status: available through Python relay/session-cookie style integration.",
          "Inbound support: /api/channels/zalo/incoming accepts relay payloads and scopes messages by account when accountId is present.",
          "Outbound support: available through the relay/send helpers when the session is valid.",
          "Auth/config support: cookies/session input, optional relaySecret, python command, script path, account/OA id.",
          "Needs real credential: valid Zalo session/cookies and relay runtime; relaySecret is recommended for production safety.",
          "Production readiness: fallback/demo/current operational mode, not an official Zalo OA API integration.",
        ],
      },
      {
        title: "Zalo Official OA",
        items: [
          "Runtime status: planned/config-ready only; official OA adapter is not implemented in the current product flow.",
          "Inbound support: not implemented for official OA API.",
          "Outbound support: not implemented for official OA API.",
          "Auth/config support: should be designed separately if the team chooses official OA.",
          "Needs real credential: official OA credentials and approval from Zalo.",
          "Production readiness: future phase, not current runtime.",
        ],
      },
      {
        title: "Shopee",
        items: [
          "Runtime status: pre-E2E ready with account config, auth start/callback, token helper, webhook receiver, normalized inbound, and send adapter scaffold.",
          "Inbound support: /api/webhooks/shopee parses supported buyer text events and hands them to the normalized flow.",
          "Outbound support: send adapter exists but must be verified with a real Shopee Partner App/shop and approved chat scope.",
          "Auth/config support: Partner ID, Partner Key, shop authorization callback, access token, refresh token, webhook secret.",
          "Needs real credential: legitimate Shopee Seller account and Shopee Open Platform Partner App.",
          "Production readiness: not ready until real Seller/Partner E2E passes auth, webhook, receive, send, token refresh, idempotency, and fallback checks.",
        ],
      },
      {
        title: "TikTok Shop",
        items: [
          "Runtime status: pre-E2E inbound scaffold.",
          "Inbound support: /api/webhooks/tiktok-shop accepts customer-service style message payloads and maps text into normalized inbound flow.",
          "Outbound support: not finalized; send-message endpoint/scope must be verified in TikTok Shop Partner Center.",
          "Auth/config support: account config and secret masking exist; OAuth/callback contract is not finalized.",
          "Needs real credential: legitimate TikTok Shop Seller account plus Partner Center/Open Platform app.",
          "Production readiness: no. It requires Partner Center contract verification, real webhook payload, send-message API, token refresh, idempotency, and E2E buyer chat test.",
        ],
      },
      {
        title: "WhatsApp",
        items: [
          "Runtime status: available in current implementation through whatsapp-web.js / WhatsApp Web style runtime.",
          "Inbound support: available when the local WhatsApp client is connected and message events are received.",
          "Outbound support: available through the current WhatsApp client send helper.",
          "Auth/config support: QR/session based current flow; Cloud API multi-account is not the current implementation.",
          "Needs real credential: phone/session/QR connection and stable runtime host.",
          "Production readiness: partial; depends on session stability and should be reassessed before customer go-live.",
        ],
      },
      {
        title: "Email",
        items: [
          "Runtime status: available for SMTP/IMAP style configuration in current implementation.",
          "Inbound support: depends on configured mailbox polling/IMAP flow in environment.",
          "Outbound support: available through SMTP send helper when settings are valid.",
          "Auth/config support: SMTP/IMAP host, ports, user, password/from address.",
          "Needs real credential: customer mailbox credentials or app password.",
          "Production readiness: available after real mailbox send/receive test and spam/deliverability review.",
        ],
      },
      {
        title: "Phone / Twilio voice",
        items: [
          "Runtime status: available if Twilio settings are configured.",
          "Inbound support: /api/channels/phone/incoming and gather/status routes support Twilio voice flow.",
          "Outbound support: voice response/TwiML path exists; full call operations depend on Twilio credentials and phone number.",
          "Auth/config support: Twilio SID, token, phone number, callback URLs, optional voice provider settings.",
          "Needs real credential: Twilio account, phone number, webhook URLs, valid signatures.",
          "Production readiness: available after real call E2E, signature verification, and fallback handling.",
        ],
      },
      {
        title: "SMS / Twilio",
        items: [
          "Runtime status: available if Twilio SMS settings are configured.",
          "Inbound support: /api/channels/sms maps inbound SMS into normalized inbound flow.",
          "Outbound support: TwiML response path and Twilio send helper are available when configured.",
          "Auth/config support: Twilio SID, token, phone number, webhook signature validation.",
          "Needs real credential: Twilio account, SMS-capable number, public webhook URL.",
          "Production readiness: available after real SMS send/receive E2E and opt-in/compliance review.",
        ],
      },
      {
        title: "Telegram",
        items: [
          "Runtime status: available for bot webhook style text messages.",
          "Inbound support: /api/channels/telegram maps text messages into normalized inbound flow.",
          "Outbound support: Bot API sendMessage is used when bot token is configured.",
          "Auth/config support: Telegram bot token and webhook registration.",
          "Needs real credential: Telegram bot token and public webhook URL.",
          "Production readiness: available after real bot E2E and webhook delivery/retry review.",
        ],
      },
    ],
    endpoints: [],
  },
  {
    id: "connection-status-definitions",
    name: "Connection Status Definitions",
    icon: Key,
    notes: [
      "These labels describe integration progress, not business approval. A channel can be authorized but still not ready for real customers.",
      "Authorized != production-ready. Connected != bot has replied successfully on the external platform.",
    ],
    guideGroups: [
      {
        title: "Status meanings",
        items: [
          "config_saved: configuration was saved, but authorization and real webhook/chat verification have not finished.",
          "authorization_required: an admin must open the platform authorization/approval screen and grant access.",
          "authorized: token/account/shop/page id exists, but webhook receive and outbound send are not proven yet.",
          "webhook_pending: webhook is expected but no valid real webhook has been accepted yet.",
          "webhook_verified: a valid webhook request reached the app and passed parsing/signature checks.",
          "chat_receive_verified: a real or accepted test customer message was parsed and entered the normalized inbound flow.",
          "chat_send_verified: the app successfully delivered a reply back to the external platform.",
          "production_ready: only use after auth, webhook, receive, send, token refresh, idempotency, rate-limit/backoff, monitoring, and human fallback are verified.",
          "error: account or channel needs operator review; do not treat it as connected.",
        ],
      },
      {
        title: "Operator rules",
        items: [
          "Do not promise production readiness from config_saved or authorized alone.",
          "Do not mark Shopee/TikTok Shop production-ready without a real Seller/Partner Center E2E test.",
          "Do not store raw webhook payloads, raw buyer messages, tokens, signatures, or keys in debug metadata.",
          "When in doubt, show the current stage and the next missing verification step instead of saying connected.",
        ],
      },
    ],
    endpoints: [],
  },
  {
    id: "real-e2e-testing-checklist",
    name: "Real E2E Testing Checklist",
    icon: Webhook,
    notes: [
      "Use this checklist when lead/customer provides real platform credentials. It is intentionally platform-neutral first, then platform-specific.",
      "The goal is to prove the full path: platform customer message -> webhook/inbound -> conversation -> AI response -> outbound reply -> safe logs/fallback.",
    ],
    guideGroups: [
      {
        title: "General E2E checklist",
        items: [
          "Confirm the platform account exists and belongs to the customer.",
          "Confirm developer/partner app exists and is approved enough for the tested feature.",
          "Confirm callback/webhook uses a public HTTPS URL, not localhost.",
          "Add the ChannelAccount or channel config in LinhKienLed1000.",
          "Save config and verify secrets are masked in UI/API responses.",
          "Authorize/connect where the platform supports OAuth or shop/page approval.",
          "Configure webhook URL in the platform console.",
          "Send a real user/customer message from the platform.",
          "Confirm safe webhook debug metadata updates without raw message text or secrets.",
          "Confirm a conversation is created with correct channel and channelAccountId where applicable.",
          "Confirm bot response is generated from the correct Knowledge Base context.",
          "Confirm outbound reply is delivered back to the platform.",
          "Confirm no secret/token/signature/raw buyer PII appears in UI, logs, or screenshots.",
          "Confirm retry/idempotency behavior does not duplicate replies.",
          "Confirm token refresh or credential rotation behavior before go-live.",
        ],
      },
      {
        title: "Meta E2E",
        items: [
          "Verify /api/webhooks/meta with Meta's hub.challenge flow.",
          "Send a Facebook Page message and confirm channel=facebook conversation plus outbound reply.",
          "Send an Instagram DM and confirm channel=instagram conversation plus outbound reply.",
          "Check x-hub-signature-256 verification when appSecret is configured.",
          "Confirm Meta app mode, app review, page/account permissions, and token lifetime for production users.",
        ],
      },
      {
        title: "Zalo E2E",
        items: [
          "Start the Python relay with valid session/cookies for the intended Zalo account.",
          "Configure relaySecret and verify the relay sends x-zalo-relay-secret.",
          "Send a real Zalo message and confirm /api/channels/zalo/incoming receives account-scoped payload.",
          "Confirm conversation channel=zalo and outbound relay reply works.",
          "Remember this is the Python relay/session-cookie path, not official OA API.",
        ],
      },
      {
        title: "Shopee E2E",
        items: [
          "Use a legitimate Shopee Seller account and Open Platform Partner App.",
          "Save Partner ID/Partner Key in Channels -> Accounts -> Shopee.",
          "Open auth start /api/channels/shopee/auth/start?accountId=<channelAccountId> through the app, not by manually calling callback.",
          "Approve the app in Shopee and verify callback stores tokens with status=authorized.",
          "Configure webhook to /api/webhooks/shopee and send a buyer chat message.",
          "Confirm webhook_verified, chat_receive_verified, and chat_send_verified before any production claim.",
        ],
      },
      {
        title: "TikTok Shop E2E",
        items: [
          "Use a legitimate TikTok Shop Seller account and Partner Center/Open Platform app.",
          "Confirm Customer Service/Conversation/Message scopes and exact OAuth/webhook/signature/send-message contract in Partner Center.",
          "Save Shop/Seller ID, App/Client key, App secret, tokens, and webhookSecret when available.",
          "Configure webhook to /api/webhooks/tiktok-shop if Partner Center allows it.",
          "Send/capture a real customer-service message payload and confirm safe debug metadata plus normalized conversation creation.",
          "Only complete outbound reply after send-message endpoint/scope are verified with the real Partner Center app.",
        ],
      },
    ],
    endpoints: [],
  },
  {
    id: "platform-bypass-limits",
    name: "What This App Cannot Bypass",
    icon: BookOpen,
    notes: [
      "This section is for expectation-setting with lead/customer. The app can store config and process messages, but it cannot override platform rules.",
    ],
    guideGroups: [
      {
        title: "Hard platform limits",
        items: [
          "The app cannot create a Seller shop, Facebook Page, Instagram account, Zalo account, or Telegram bot on behalf of the customer.",
          "The app cannot bypass seller verification, tax verification, bank verification, identity checks, or business verification required by Shopee, TikTok Shop, Meta, Zalo, Twilio, or any provider.",
          "The app cannot bypass Meta app review, TikTok Shop Partner Center approval, Shopee Open Platform approval, or Zalo official API approval.",
          "The app cannot grant API scopes that the platform has not approved for the customer app/account.",
          "The app cannot guarantee gated Partner Console endpoints work until a real approved app/account is used.",
          "The app should not store raw payloads, raw buyer messages, raw tokens, raw signatures, app secrets, partner keys, or refresh tokens in visible debug metadata.",
          "The app cannot guarantee price, stock, VAT, or warranty accuracy unless the customer uploads verified Knowledge Base data for those topics.",
        ],
      },
    ],
    endpoints: [],
  },
  {
    id: "lead-handoff-message",
    name: "Suggested Handoff Message",
    icon: Users,
    notes: [
      "Copy this when reporting status to lead/customer. Adjust platform names depending on what credentials the customer is ready to provide.",
    ],
    guideGroups: [
      {
        title: "Vietnamese handoff message",
        items: [
          "Em đã hoàn thiện phần nền tảng multi-channel/multi-account ở mức pre-E2E. Facebook/Instagram/Zalo relay có runtime hiện tại; Shopee đã có auth/callback/webhook/send scaffold; TikTok Shop đã có config + webhook inbound + normalized flow nhưng cần Partner Center thật để xác minh OAuth/send-message contract. Bước tiếp theo cần account/app thật để test E2E từng nền tảng trước khi gọi production-ready.",
        ],
      },
      {
        title: "Short technical summary",
        items: [
          "Implemented: account config, secret masking, normalized inbound, webhook routes for supported flows, Shopee/TikTok docs and tests.",
          "Not yet production claim: marketplace OAuth/send contracts that require real Partner/Seller console access.",
          "Next action: collect real credentials, configure public HTTPS callback/webhook URLs, run platform-specific E2E tests, then mark only verified channels as production_ready.",
        ],
      },
    ],
    endpoints: [],
  },
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
          businessName: "LED1000 / Linh Kiện LED1000",
          welcomeMessage:
            "Xin chào! LED1000 có thể hỗ trợ bạn tìm đèn LED, nguồn điện, linh kiện hoặc phụ kiện phù hợp.",
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
      "Both Facebook and Instagram use the same callback URL in LinhKienLed1000: <APP_ORIGIN>/api/webhooks/meta.",
      "Use this guide to understand what each key/token is, where it comes from, and where to paste it in Channels -> Accounts.",
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
          "Decide one Verify Token string, for example led1000-meta-verify-token. This is not provided by Meta; you create it and paste the same value into LinhKienLed1000 and Meta Dashboard.",
          "Facebook and Instagram can use the same Verify Token for simplicity, or separate Verify Tokens if configured separately. The value entered in Meta Dashboard must match the value saved in the corresponding LinhKienLed1000 channel settings.",
          "Keep Page Access Token, Instagram Access Token, and App Secret private. Do not send real values in chat, screenshots, public docs, or commits.",
        ],
      },
      {
        title: "2. Understand what each Meta value means",
        items: [
          "Meta Developer App: the container in developers.facebook.com where products, webhook callback, app secret, and permissions are configured.",
          "Facebook Page: the public page customers message through Messenger. It is different from the Meta Developer App.",
          "Instagram Business or Creator Account: the Instagram account customers message through Direct Messaging.",
          "Callback URL: the LinhKienLed1000 webhook URL Meta calls. Use <APP_ORIGIN>/api/webhooks/meta for both Facebook and Instagram.",
          "Verify Token: a shared text value used only when Meta verifies the callback URL. LinhKienLed1000 checks hub.verify_token against this value.",
          "Access Token: the secret credential LinhKienLed1000 uses to send replies back to Facebook or Instagram.",
          "App Secret: the Meta App secret used to validate x-hub-signature-256 on webhook POST requests.",
          "Graph Version: the Meta Graph API version used for send/config calls, for example v25.0.",
        ],
      },
      {
        title: "3. Where to paste in LinhKienLed1000",
        items: [
          "Channels -> Accounts -> Facebook -> Verify Token.",
          "Channels -> Accounts -> Facebook -> Page Access Token.",
          "Channels -> Accounts -> Facebook -> Page ID, optional.",
          "Channels -> Accounts -> Facebook -> Graph Version.",
          "Channels -> Accounts -> Facebook -> App Secret, required for production webhook signature checks.",
          "Channels -> Accounts -> Instagram -> Verify Token.",
          "Channels -> Accounts -> Instagram -> Access Token.",
          "Channels -> Accounts -> Instagram -> Business Account ID, optional.",
          "Channels -> Accounts -> Instagram -> Graph Version.",
          "Channels -> Accounts -> Instagram -> App Secret, required for production webhook signature checks.",
        ],
      },
      {
        title: "4. Create or choose the Meta Developer App",
        items: [
          "Open Meta for Developers, then open Apps. If the customer already has a Meta App, use that app instead of creating a duplicate.",
          "Create an app only if there is no suitable existing app for this business.",
          "Inside the app, add or configure the Messenger product for Facebook Messenger.",
          "Inside the same app, add or configure the Instagram product/API flow for Instagram Direct Messaging.",
          "Open App settings and copy the App Secret only if LinhKienLed1000 will verify webhook signatures in this environment.",
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
          "Select the Facebook Page that LinhKienLed1000 should reply from.",
          "Generate or copy the Page Access Token for that Page.",
          "Paste it into LinhKienLed1000 Channels -> Accounts -> Facebook -> Page Access Token.",
          "Optional Page ID lookup: call https://graph.facebook.com/v25.0/me?fields=id,name&access_token=YOUR_FACEBOOK_PAGE_ACCESS_TOKEN and use the returned id.",
          "If the token later returns 401 or 403, regenerate it or check permissions/app mode/review in Meta Dashboard.",
        ],
      },
      {
        title: "7. Configure Facebook Messenger webhook",
        items: [
          "In LinhKienLed1000 Channels -> Accounts -> Facebook, add or edit the Page account and fill Verify Token, Page Access Token, Graph Version, optional Page ID, and App Secret.",
          "Save the Facebook account config before testing Meta verification.",
          "In Meta Dashboard webhook settings, set Callback URL to <APP_ORIGIN>/api/webhooks/meta.",
          "Set Verify Token in Meta Dashboard to exactly the same value saved in LinhKienLed1000.",
          "Subscribe the Facebook Page/webhook to the Messenger message events required by the app.",
          "Send a real message to the Facebook Page and confirm LinhKienLed1000 creates a conversation with channel=facebook.",
        ],
      },
      {
        title: "8. Prepare the Instagram account",
        items: [
          "Use an Instagram Business or Creator account according to Meta's current requirements.",
          "Confirm the setup user can manage the Instagram account and any related business assets required by Meta.",
          "Use Instagram API with Instagram Login / Direct Messaging. Instagram Basic Display API is not enough for chatbot messaging.",
          "If the account is new or not eligible, complete Meta's account/business setup first before connecting LinhKienLed1000.",
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
          "Paste it into LinhKienLed1000 Channels -> Accounts -> Instagram -> Access Token.",
          "Optional Business Account ID is metadata for checking/debugging. Webhook recipient.id can also help confirm which Instagram account received a message.",
        ],
      },
      {
        title: "10. Configure Instagram Direct Messaging webhook",
        items: [
          "In LinhKienLed1000 Channels -> Accounts -> Instagram, add or edit the Business account and fill Verify Token, Access Token, Graph Version, optional Business Account ID, and App Secret.",
          "Save the Instagram account config before testing Meta verification.",
          "In Meta Dashboard webhook settings, use the same shared callback URL: <APP_ORIGIN>/api/webhooks/meta.",
          "Set Verify Token in Meta Dashboard to exactly the same value saved in LinhKienLed1000.",
          "Subscribe the required Instagram messaging/webhook events in Meta Dashboard.",
          "Send a real DM to the Instagram account and confirm LinhKienLed1000 creates a conversation with channel=instagram.",
        ],
      },
      {
        title: "11. Production note",
        items: [
          "In development mode, only admins, developers, or testers may be able to interact with the Meta App.",
          "If internal testers can send messages but real customers cannot, check Meta App Review, required permissions, app mode, and business verification requirements.",
          "Before going live for a customer, review the official Meta docs for the current permission and review requirements for Messenger and Instagram Direct Messaging.",
          "Do not treat a successful local webhook test as full production approval. It only proves LinhKienLed1000 can receive the payload shape.",
        ],
      },
      {
        title: "12. How to know setup is working",
        items: [
          "Meta webhook verification succeeds when Meta sends hub.mode=subscribe and LinhKienLed1000 returns hub.challenge as plain text.",
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
          "If any token is exposed, rotate or revoke it in Meta Developer Dashboard and update the matching LinhKienLed1000 account in Channels -> Accounts.",
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
    id: "shopee-setup-guide",
    name: "Shopee Setup Guide",
    icon: Download,
    notes: [
      "Current app status: Shopee runtime scaffolding is implemented: account config, shop authorization start/callback, token exchange/refresh helper, webhook receiver, tolerant chat payload parser, normalized inbound handoff, and outbound send adapter. A saved or authorized account is not the same as production-ready; final verification still requires a real Shopee Partner App, an existing legitimate Seller shop, approved scopes, and an end-to-end buyer chat test.",
      "Goal status: To make the bot answer real Shopee buyers, LED1000 needs an existing legitimate Shopee Seller/admin account, Shopee Open Platform partner app, approved scopes, and a real end-to-end buyer message test.",
      "Official docs status: Shopee Open Platform docs and exact scopes can be gated by partner login. Treat the official docs and partner console as the source of truth for endpoint names, permission review, token lifetime, and message policy.",
      "Security: Never paste real partner_key, access_token, refresh_token, request signatures, tax/business verification data, or buyer personal data into chat, screenshots, public docs, logs, or Git commits.",
    ],
    guideGroups: [
      {
        title: "1. What exists in LinhKienLed1000 today",
        items: [
          "ChannelAccount supports type=shopee and can store one or more Shopee shops.",
          "The account form supports Shop ID, Partner ID, Access Token, Refresh Token, and Partner Key.",
          "GET responses mask Shopee secrets with flags such as hasAccessToken, hasRefreshToken, and hasPartnerKey.",
          "NormalizedInboundMessage already has channel=shopee and the Shopee webhook route maps buyer messages into that shared handler.",
          "/api/webhooks/shopee receives Shopee push/webhook payloads and processes supported text chat events.",
          "The Shopee send-message adapter signs outbound calls and attempts to send the AI response back to the buyer chat.",
        ],
      },
      {
        title: "2. Shopee prerequisites",
        items: [
          "Use an existing legitimate LED1000/customer-owned Shopee Seller account. This app does not create Shopee shops and a normal buyer account is not enough.",
          "Make sure the setup user has admin permission for the Shopee shop that will receive customer chat.",
          "Create or obtain a Shopee Open Platform developer/partner account. If Shopee requires seller, tax, identity, or business verification, complete that process inside Shopee/Seller Center; the app cannot bypass it and must not use fake verification data.",
          "Create a partner app in Shopee Open Platform for LinhKienLed1000.",
          "Prepare the public HTTPS app URL. In production use the deployed customer domain; for local verification use an HTTPS tunnel only for testing.",
          "Confirm the required modules/scopes in Shopee Open Platform: shop authorization, product/listing, order, push/webhook, and chat/customer-service messaging if available for the app.",
          "Confirm Shopee policy allows automatic replies for this shop/app category before enabling fully automated chatbot replies.",
        ],
      },
      {
        title: "3. URLs to configure",
        items: [
          "Auth start: GET /api/channels/shopee/auth/start?accountId=<channelAccountId>. Use this route from the app so the accountId is attached correctly.",
          "Callback: GET /api/channels/shopee/auth/callback. Users should not call callback by hand; Shopee calls it after seller approval.",
          "Redirect URL base: https://<your-app-domain>/api/channels/shopee/auth/callback.",
          "The actual callback must include accountId. Do not call the callback by hand; save the Shopee account in LinhKienLed1000 and use the generated auth start URL so accountId is attached correctly.",
          "Webhook URL: https://<your-app-domain>/api/webhooks/shopee.",
          "Use a public HTTPS domain. Localhost only works through a temporary HTTPS tunnel for testing.",
        ],
      },
      {
        title: "4. Connection state labels used by this app",
        items: [
          "config_saved: shop/account placeholder and non-secret config were saved, but authorization has not started.",
          "authorization_required: admin clicked connect and must finish Shopee Seller authorization in Shopee.",
          "authorized: access_token, refresh_token, and shop_id were saved after Shopee callback; webhook/chat are not verified yet.",
          "webhook_verified: a signed Shopee webhook was accepted. This is not enough by itself for chat production readiness.",
          "chat_receive_verified: a Shopee buyer chat payload reached the normalized inbound flow.",
          "chat_send_verified: the app attempted and confirmed a send-message API call succeeded for a buyer chat.",
          "production_ready: only use after scopes, webhook, receive, send, token refresh, logs, and staff handoff have been verified with the customer shop.",
          "error: the account needs operator review. Do not treat it as connected.",
        ],
      },
      {
        title: "5. Understand Shopee values",
        items: [
          "Partner ID: public numeric/app identifier from the Shopee Open Platform partner app.",
          "Partner Key: secret key used to sign Shopee API requests. Store it only in masked secret config.",
          "Shop ID: Shopee shop identifier after the seller authorizes the partner app.",
          "Access Token: token used for signed shop API calls after authorization.",
          "Refresh Token: token used to rotate/refresh the access token before expiry.",
          "Redirect URL: public URL Shopee redirects to after seller authorization. Use <APP_ORIGIN>/api/channels/shopee/auth/callback?accountId=<CHANNEL_ACCOUNT_ID> unless a custom redirectUrl is configured.",
          "Webhook/Push URL: public HTTPS endpoint Shopee calls for events. Use <APP_ORIGIN>/api/webhooks/shopee.",
        ],
      },
      {
        title: "6. In-app steps",
        items: [
          "1. Open Channels -> Accounts -> Add Shopee.",
          "2. Enter a display name and Shop ID placeholder if known.",
          "3. Enter Partner ID and Partner Key from Shopee Open Platform. Do not paste these into logs or screenshots.",
          "4. Save the config. The status should be config_saved.",
          "5. Click Ủy quyền shop/Kết nối. The browser redirects to Shopee authorization.",
          "6. Log in as the legitimate Shopee Seller/admin and approve the Partner App.",
          "7. After callback, the app stores access_token, refresh_token, and shop_id. The status should be authorized, not production-ready.",
          "8. Configure the webhook URL in Shopee Open Platform.",
          "9. Send a buyer message test from Shopee chat.",
          "10. Check status/debug: webhook_verified, chat_receive_verified, and chat_send_verified should appear as each stage succeeds.",
        ],
      },
      {
        title: "7. Runtime pieces implemented in this app",
        items: [
          "Shopee signing helper builds OpenAPI v2-style HMAC signatures for auth, token, and signed API calls.",
          "/api/channels/shopee/auth/start redirects the admin browser to Shopee shop authorization.",
          "/api/channels/shopee/auth/callback exchanges the authorization code for access_token, refresh_token, and shop_id.",
          "Tokens are stored per ChannelAccount config and masked in admin/API responses. After successful token exchange the account status is authorized, which only means credentials were saved.",
          "Token refresh helper is available and the send adapter checks tokenExpiresAt before sending; if the token is near expiry it attempts refresh-on-demand without logging tokens.",
          "No scheduler/cron is included yet. Production should add a cron/queue after token lifetime is verified in Shopee console.",
          "/api/webhooks/shopee receives events and verifies HMAC signatures when webhookSecret or partnerKey is configured.",
          "Incoming buyer text events are mapped into NormalizedInboundMessage with channel=shopee.",
          "Call processNormalizedInboundMessage() to create/update customer conversation and get the AI response.",
          "Shopee outbound send-message adapter signs and sends the AI response back to the buyer chat.",
          "Idempotency key helper exists for channel + shop_id + message_id/conversation_id and is stored as safe metadata. Durable storage-backed dedupe is still required before production go-live.",
          "Known gap: rate-limit/backoff and production alerting should be tuned after real Shopee response codes are observed.",
        ],
      },
      {
        title: "8. Target runtime flow after implementation",
        items: [
          "Buyer sends message in Shopee chat.",
          "Shopee Push/Webchat Push calls <APP_ORIGIN>/api/webhooks/shopee.",
          "LinhKienLed1000 verifies request signature and finds ChannelAccount by shop_id.",
          "Shopee payload maps to NormalizedInboundMessage: channel=shopee, channelAccountId, externalCustomerId, customerContact=shopee:<buyer_id>, externalConversationId, platformMessageId, text.",
          "processNormalizedInboundMessage() resolves customer, finds or creates the conversation, calls chat(), and returns the AI response.",
          "Shopee send adapter signs a send-message API request and sends the bot response back to Shopee.",
          "The Conversations page shows platform=Shopee, shop/account name, buyer identity, status, and the message history.",
        ],
      },
      {
        title: "9. Testing checklist",
        items: [
          "Unit test Shopee signing helper with official examples from Shopee console/docs.",
          "Unit test token refresh without printing tokens.",
          "API test webhook signature rejection for invalid/missing signature.",
          "API test incoming chat payload creates a conversation with channel=shopee and channelAccountId set.",
          "API test duplicate event id is ignored or does not send a second reply.",
          "API test outbound send adapter builds signed request with the correct shop_id/access_token but never logs secrets.",
          "End-to-end test with a real Shopee test shop: buyer sends message -> bot creates conversation -> bot sends reply.",
        ],
      },
      {
        title: "10. Troubleshooting",
        items: [
          "Cannot create partner app: the business may need a verified Shopee Open Platform partner/developer account.",
          "Seller authorization fails: check redirect URL, app status, region, and shop admin permission.",
          "401/403 from Shopee: token expired, app lacks scope, signature is wrong, or shop authorization was revoked.",
          "Webhook not received: check public HTTPS URL, Shopee push configuration, firewall, tunnel, and app approval state.",
          "Webhook received but no bot reply: check payload mapping, AI provider/API key, Knowledge Base data, and Shopee send-message scope.",
          "Bot replies twice: check webhook retry idempotency by event id/message id.",
          "Can read product/order data but cannot chat: chat/customer-service API may require separate scope or approval.",
        ],
      },
      {
        title: "11. Go-live gate",
        items: [
          "Do not tell the customer Shopee chatbot is production-ready until a real buyer message test passes end to end: webhook received, conversation created, AI response generated, and reply sent back to Shopee.",
          "Confirm exact Shopee scopes and automated messaging policy inside the customer partner console.",
          "Confirm token refresh works for more than one token cycle; send adapter has refresh-on-demand, but production still needs scheduler/monitoring.",
          "Confirm webhook signature verification is enabled in production.",
          "Confirm logs never expose partner_key, access_token, refresh_token, signatures, or raw buyer personal data.",
          "Confirm durable idempotency/dedupe is enabled so Shopee webhook retries do not create duplicate bot replies.",
          "Confirm rate-limit/backoff plan for Shopee API failures.",
          "Confirm staff handoff/ticket creation works for messages the bot cannot answer safely.",
        ],
      },
      {
        title: "12. Shopee limitations",
        items: [
          "Endpoint/path names for seller chat must be verified in the real Shopee Partner Console/docs for the customer app and region.",
          "Webhook payload shape should be captured safely from a real test event before treating parser behavior as final.",
          "Chat/customer-service scope may require separate Shopee approval even if product/order APIs work.",
          "Durable storage-backed idempotency/dedupe remains a production requirement before live operation.",
          "Rate-limit/backoff and production alerting should be tuned after real Shopee response codes are observed.",
        ],
      },
    ],
    links: [
      {
        label: "Shopee Open Platform",
        url: "https://open.shopee.com/",
      },
      {
        label: "Shopee API Calls",
        url: "https://open.shopee.com/developer-guide/16",
      },
      {
        label: "Shopee Push Mechanism",
        url: "https://open.shopee.com/developer-guide/18",
      },
      {
        label: "Shopee Authorization Process",
        url: "https://open.shopee.com/developer-guide/20",
      },
      {
        label: "Shopee Order Management",
        url: "https://open.shopee.com/developer-guide/229",
      },
      {
        label: "Shopee Product Price Guide",
        url: "https://open.shopee.com/developer-guide/223",
      },
      {
        label: "Shopee Platform Partner Rules",
        url: "https://open.shopee.com/developer-guide/34",
      },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api/channels/shopee/auth/start",
        description:
          "Start Shopee shop authorization for a saved Shopee ChannelAccount. This route redirects the admin browser to Shopee Open Platform authorization.",
        queryParams: [
          {
            name: "accountId",
            type: "string",
            required: true,
            description: "Internal ChannelAccount id for the Shopee shop placeholder/config.",
          },
        ],
        responseExample: "302 Redirect to Shopee authorization URL",
      },
      {
        method: "GET",
        path: "/api/channels/shopee/auth/callback",
        description:
          "Shopee redirects here after seller authorization. The route exchanges code + shop_id for access_token and refresh_token, stores them in the Shopee ChannelAccount, then redirects back to /channels/accounts.",
        queryParams: [
          { name: "accountId", type: "string", required: true, description: "Internal ChannelAccount id." },
          { name: "code", type: "string", required: true, description: "Authorization code returned by Shopee." },
          { name: "shop_id", type: "string", required: true, description: "Authorized Shopee shop id." },
        ],
        responseExample: "302 Redirect to /channels/accounts?channel=shopee&status=authorized",
      },
      {
        method: "POST",
        path: "/api/webhooks/shopee",
        description:
          "Receive Shopee push/webhook payloads. Supported text chat events are mapped into the normalized inbound handler, then the Shopee send adapter attempts to reply to the buyer chat.",
        headers: [
          {
            name: "authorization / x-shopee-signature / x-shopee-hmac-sha256 / x-shopee-sign",
            type: "header",
            required: false,
            description:
              "Webhook HMAC signature header. Required when webhookSecret or partnerKey is configured for the Shopee ChannelAccount.",
          },
        ],
        requestBody: {
          code: "chat_push",
          shop_id: 1001,
          data: {
            buyer_id: 2002,
            conversation_id: "conv-1",
            message_id: "msg-1",
            message: { text: "Có LED dây COB không?" },
          },
        },
        responseExample: { ok: true, received: 1, processed: 1, sent: 1 },
      },
    ],
  },
  {
    id: "tiktok-shop-setup-guide",
    name: "TikTok Shop Setup Guide",
    icon: Download,
    notes: [
      "Current app status: TikTok Shop account storage, masked config, webhook receiver, tolerant customer-message parser, and normalized inbound handoff are implemented. Real auth URL, scopes, exact webhook payload/signature, and outbound send endpoint must be verified in TikTok Shop Partner Center before production.",
      "Use TikTok Shop Partner Center/Open Platform for seller customer-service chat. TikTok for Developers and TikTok Business API are not the right surface for Seller Center buyer chat.",
      "Security: never paste real appSecret, access_token, refresh_token, webhook signatures, request bodies, or buyer personal data into chat, screenshots, public docs, logs, or Git commits.",
    ],
    guideGroups: [
      {
        title: "1. What exists in LinhKienLed1000 today",
        items: [
          "ChannelAccount supports type=tiktok_shop and can store one or more TikTok Shop seller/shop accounts.",
          "The account form supports Shop/Seller ID, App/Client key, App secret, access token, refresh token, webhook secret, API base URL, auth base URL, and send message path.",
          "GET responses mask TikTok Shop secrets with flags such as hasAccessToken, hasRefreshToken, hasAppSecret, and hasWebhookSecret.",
          "POST /api/webhooks/tiktok-shop accepts mocked/Partner-Center-style customer-service message payloads and maps text messages into NormalizedInboundMessage with channel=tiktok_shop.",
          "Outbound send back to TikTok Shop is intentionally not marked production-ready until exact Partner Center Customer Service API contract is verified with a real app/shop.",
        ],
      },
      {
        title: "2. Prerequisites",
        items: [
          "Create or obtain a legitimate TikTok Shop Seller account for the customer. A normal TikTok user account is not enough.",
          "Make sure the operator has admin permission for the shop/seller account.",
          "Create or obtain a TikTok Shop Partner Center/Open Platform app for LinhKienLed1000.",
          "Request/confirm Customer Service or buyer chat messaging scopes in Partner Center.",
          "Prepare a public HTTPS app URL. For local testing, use a temporary HTTPS tunnel only for testing.",
          "Confirm the official authorization URL, callback URL, webhook event name such as NEW_MESSAGE, signature header/rule, token lifetime, and send-message endpoint in Partner Center.",
        ],
      },
      {
        title: "1A. Current app status details",
        items: [
          "account config: implemented through ChannelAccount type=tiktok_shop.",
          "secret masking: implemented with hasAccessToken, hasRefreshToken, hasAppSecret, and hasWebhookSecret flags.",
          "webhook inbound route: implemented at POST /api/webhooks/tiktok-shop.",
          "safe debug metadata: implemented without storing raw payloads or raw message text.",
          "normalized inbound flow: implemented with channel=tiktok_shop.",
          "mock/local tests: implemented for parser, signature helper, account config, and webhook route.",
          "OAuth/callback: requires Partner Center contract verification before implementation can be finalized.",
          "outbound send-message: requires Partner Center contract verification before production use.",
          "production-ready: no, not until real Partner Center E2E passes.",
        ],
      },
      {
        title: "3. URLs to configure",
        items: [
          "Webhook URL: https://<your-app-domain>/api/webhooks/tiktok-shop.",
          "Authorization/callback URL: verify the exact TikTok Shop Partner Center OAuth flow first, then configure the app callback URL that matches the final implementation.",
          "Localhost does not work for real TikTok webhooks. Use deployed HTTPS or a temporary HTTPS tunnel for testing.",
        ],
      },
      {
        title: "3A. TikTok Shop config fields",
        items: [
          "shopId: stable TikTok Shop id when Partner Center exposes it.",
          "sellerId: seller/account id if this is the stable id exposed by TikTok Shop APIs.",
          "appKey / clientKey: public app/client identifier from Partner Center.",
          "appSecret / clientSecret: secret credential; store only as masked secret.",
          "accessToken: token for authorized API calls after real OAuth/token exchange.",
          "refreshToken: token used to rotate access token when TikTok Shop provides it.",
          "webhookSecret: signing secret or equivalent verification material.",
          "integrationStatus: current stage such as config_saved, authorization_required, webhook_verified, chat_receive_verified, or production_ready.",
          "lastWebhookAt, lastWebhookParseStatus, lastChatReceiveAt, lastChatSendAt: safe debug timestamps/status only.",
          "sendMessagePath: pending/verified send-message path. Leave unset until Partner Center confirms the endpoint.",
        ],
      },
      {
        title: "4. In-app steps",
        items: [
          "1. Open Channels -> Accounts -> Add TikTok Shop.",
          "2. Enter display name and Shop/Seller ID.",
          "3. Enter App/Client key and App secret from Partner Center. Do not expose these in logs or screenshots.",
          "4. Save the config. The status should be config_saved.",
          "5. Click Ủy quyền shop. Current behavior keeps status at authorization_required until the exact Partner Center auth flow is verified.",
          "6. Configure webhook URL in Partner Center and send a real/test buyer message payload.",
          "7. Check safe debug fields on the account: webhook_verified and chat_receive_verified indicate inbound receive works. chat_send_verified should only be used after outbound send API is verified.",
        ],
      },
      {
        title: "5. Runtime flow target",
        items: [
          "Buyer sends message in TikTok Shop customer service chat.",
          "TikTok Shop webhook calls <APP_ORIGIN>/api/webhooks/tiktok-shop.",
          "LinhKienLed1000 verifies signature when webhookSecret/appSecret is configured and finds ChannelAccount by shop_id/seller_id.",
          "Payload maps to NormalizedInboundMessage: channel=tiktok_shop, channelAccountId, externalCustomerId, customerContact=tiktok_shop:<shop_id>:<buyer_id>, externalConversationId, platformMessageId, text.",
          "processNormalizedInboundMessage() resolves customer, finds or creates conversation, calls chat(), and returns the AI response.",
          "After Partner Center send endpoint is verified, a send adapter should deliver the response back to TikTok Shop buyer chat.",
        ],
      },
      {
        title: "6. Go-live gate",
        items: [
          "Do not mark TikTok Shop production_ready until a real seller app/shop passes: OAuth/token exchange, webhook signature verification, inbound buyer message, normalized conversation creation, AI response, outbound send, retry/idempotency, and staff handoff.",
          "Confirm official Customer Service API scope and automated messaging policy in Partner Center.",
          "Confirm logs never expose appSecret, accessToken, refreshToken, signatures, raw payloads, raw buyer messages, or buyer personal data.",
          "Add durable idempotency storage before live operation so webhook retries do not create duplicate replies.",
        ],
      },
      {
        title: "7. TikTok Shop expectation setting",
        items: [
          "TikTok Shop should not be expected to behave like Facebook/Instagram until Partner Center access confirms Customer Service API and Send Message contract.",
          "A saved TikTok Shop account means config exists; it does not mean OAuth, webhook signature, receive, or send has passed.",
          "If Partner Center does not grant customer-service/message scopes, the app cannot force buyer-chat automation.",
          "Any seller verification, business verification, tax, or bank requirements must be completed in TikTok Shop/Seller Center by the customer.",
        ],
      },
    ],
    links: [
      {
        label: "TikTok Shop Partner Center",
        url: "https://partner.tiktokshop.com/",
      },
      {
        label: "TikTok Shop Customer Service API Overview",
        url: "https://partner.tiktokshop.com/docv2/page/customer-service-api-overview",
      },
      {
        label: "TikTok Shop Authorization Overview",
        url: "https://partner.tiktokshop.com/docv2/page/authorization-overview-202407",
      },
      {
        label: "TikTok Webhooks Overview",
        url: "https://developers.tiktok.com/doc/webhooks-overview/",
      },
    ],
    endpoints: [
      {
        method: "POST",
        path: "/api/webhooks/tiktok-shop",
        description:
          "Receive TikTok Shop customer-service webhook payloads. Supported text message events are mapped into the normalized inbound handler. Outbound send is intentionally gated until Partner Center send-message contract is verified.",
        headers: [
          {
            name: "authorization / x-tts-signature / x-tiktok-shop-signature / x-tiktok-hmac-sha256 / x-tiktok-sign",
            type: "header",
            required: false,
            description:
              "Webhook HMAC signature header. Required when webhookSecret or appSecret is configured for the TikTok Shop ChannelAccount. Confirm the exact official signature header/rule in Partner Center.",
          },
        ],
        requestBody: {
          type: "NEW_MESSAGE",
          shop_id: 1001,
          data: {
            buyer_id: 2002,
            conversation_id: "conv-1",
            message_id: "msg-1",
            message: { text: "Có đèn pha LED không?" },
          },
        },
        responseExample: { ok: true, received: 1, processed: 1, sent: 0 },
      },
    ],
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
          "Verify the shared Meta webhook callback for Facebook Messenger and Instagram Direct Messaging. If hub.mode is subscribe and hub.verify_token matches Channels -> Accounts -> Facebook/Instagram or META_VERIFY_TOKEN, the route returns hub.challenge as plain text.",
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
            description: "Webhook verify token from Channels -> Accounts -> Facebook/Instagram or META_VERIFY_TOKEN.",
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
      "Business Account ID: optional metadata in LinhKienLed1000. The webhook payload recipient.id can help confirm which Instagram business/account received the message.",
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
  const [activeSection, setActiveSection] = useState("channel-readiness-matrix");

  const currentSection = apiSections.find((s) => s.id === activeSection) || apiSections[0];

  return (
    <div className="flex flex-col h-full">
      <Header title="API Documentation" description="Integrate LinhKienLed1000 with your systems" />

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
                      Official Docs
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

import crypto from "crypto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseMetaWebhookPayload,
  sendMetaTextMessage,
  verifyMetaSignature,
} from "@/lib/channels/meta";

describe("Meta channel adapter", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("should parse Facebook Messenger text events", () => {
    const events = parseMetaWebhookPayload({
      object: "page",
      entry: [
        {
          messaging: [
            {
              sender: { id: "psid-1" },
              recipient: { id: "page-1" },
              message: { mid: "m-1", text: "Hello salon" },
            },
          ],
        },
      ],
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      channel: "facebook",
      senderId: "psid-1",
      recipientId: "page-1",
      customerContact: "facebook:psid-1",
      customerName: "Facebook User",
      text: "Hello salon",
    });
  });

  it("should parse Instagram direct messaging text events", () => {
    const events = parseMetaWebhookPayload({
      object: "instagram",
      entry: [
        {
          messaging: [
            {
              sender: { id: "ig-sender-1" },
              recipient: { id: "ig-business-1" },
              message: { mid: "ig-m-1", text: "Can I book?" },
            },
          ],
        },
      ],
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      channel: "instagram",
      senderId: "ig-sender-1",
      recipientId: "ig-business-1",
      customerContact: "instagram:ig-sender-1",
      customerName: "Instagram User",
      text: "Can I book?",
    });
  });

  it("should ignore echo messages", () => {
    const events = parseMetaWebhookPayload({
      object: "page",
      entry: [
        {
          messaging: [
            {
              sender: { id: "psid-1" },
              recipient: { id: "page-1" },
              message: { text: "Bot reply", is_echo: true },
            },
          ],
        },
      ],
    });

    expect(events).toEqual([]);
  });

  it("should ignore non-text and unknown payloads without throwing", () => {
    expect(parseMetaWebhookPayload(null)).toEqual([]);
    expect(
      parseMetaWebhookPayload({
        object: "page",
        entry: [
          {
            messaging: [
              { sender: { id: "1" }, recipient: { id: "2" }, delivery: {} },
              {
                sender: { id: "1" },
                recipient: { id: "2" },
                message: { attachments: [{ type: "image" }] },
              },
            ],
          },
        ],
      })
    ).toEqual([]);
  });

  it("should skip signature verification without app secret", () => {
    expect(verifyMetaSignature("body", null, undefined)).toBe(true);
  });

  it("should validate correct sha256 signatures", () => {
    const rawBody = JSON.stringify({ hello: "world" });
    const secret = "meta-secret";
    const signature =
      "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    expect(verifyMetaSignature(rawBody, signature, secret)).toBe(true);
    expect(verifyMetaSignature(rawBody, "sha256=bad", secret)).toBe(false);
  });

  it("should send Facebook and Instagram messages with separate tokens", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(""),
    });
    vi.stubGlobal("fetch", fetchMock);

    process.env.META_GRAPH_VERSION = "v21.0";
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN = "fb-token";
    process.env.INSTAGRAM_ACCESS_TOKEN = "ig-token";

    await sendMetaTextMessage({
      channel: "facebook",
      recipientId: "psid-1",
      text: "Dạ em chào chị",
    });
    await sendMetaTextMessage({
      channel: "instagram",
      recipientId: "ig-sender-1",
      text: "Dạ em chào chị",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://graph.facebook.com/v21.0/me/messages?access_token=fb-token",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          recipient: { id: "psid-1" },
          message: { text: "Dạ em chào chị" },
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://graph.instagram.com/v21.0/me/messages?access_token=ig-token",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          recipient: { id: "ig-sender-1" },
          message: { text: "Dạ em chào chị" },
        }),
      })
    );
  });
});


import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRequest, parseJsonResponse } from "../helpers/request";

vi.mock("@/lib/channels/external-message", () => ({
  handleExternalChannelMessage: vi.fn().mockResolvedValue({
    conversationId: "conv-1",
    response: "AI response",
  }),
}));

describe("Meta webhook route", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.META_VERIFY_TOKEN = "verify-token";
    delete process.env.META_APP_SECRET;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(""),
      })
    );
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("should return challenge for valid GET verification", async () => {
    const { GET } = await import("@/app/api/webhooks/meta/route");
    const request = createRequest("/api/webhooks/meta", {
      searchParams: {
        "hub.mode": "subscribe",
        "hub.verify_token": "verify-token",
        "hub.challenge": "challenge-123",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("challenge-123");
  });

  it("should reject invalid GET verification token", async () => {
    const { GET } = await import("@/app/api/webhooks/meta/route");
    const request = createRequest("/api/webhooks/meta", {
      searchParams: {
        "hub.mode": "subscribe",
        "hub.verify_token": "wrong",
        "hub.challenge": "challenge-123",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("should process POST text events and reply through Meta", async () => {
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN = "fb-token";
    process.env.META_GRAPH_VERSION = "v21.0";

    const { POST } = await import("@/app/api/webhooks/meta/route");
    const { handleExternalChannelMessage } = await import("@/lib/channels/external-message");

    const request = createRequest("/api/webhooks/meta", {
      method: "POST",
      body: {
        object: "page",
        entry: [
          {
            messaging: [
              {
                sender: { id: "psid-1" },
                recipient: { id: "page-1" },
                message: { text: "Hello" },
              },
            ],
          },
        ],
      },
    });

    const response = await POST(request);
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true, received: 1 });
    expect(handleExternalChannelMessage).toHaveBeenCalledWith({
      channel: "facebook",
      customerContact: "facebook:psid-1",
      customerName: "Facebook User",
      text: "Hello",
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://graph.facebook.com/v21.0/me/messages?access_token=fb-token",
      expect.any(Object)
    );
  });

  it("should return 200 and ignore non-text payloads", async () => {
    const { POST } = await import("@/app/api/webhooks/meta/route");
    const { handleExternalChannelMessage } = await import("@/lib/channels/external-message");

    const request = createRequest("/api/webhooks/meta", {
      method: "POST",
      body: {
        object: "instagram",
        entry: [{ messaging: [{ sender: { id: "1" }, recipient: { id: "2" }, read: {} }] }],
      },
    });

    const response = await POST(request);
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true, received: 0 });
    expect(handleExternalChannelMessage).not.toHaveBeenCalled();
  });
});

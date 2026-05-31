import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/ai/engine", () => ({
  chat: vi.fn().mockResolvedValue("AI reply"),
  createNewConversation: vi.fn().mockResolvedValue({ id: "created-conv" }),
}));

vi.mock("@/lib/customer-resolver", () => ({
  resolveCustomer: vi.fn().mockResolvedValue("cust-1"),
}));

const mockPrisma = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;

describe("handleExternalChannelMessage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPrisma.conversation.findFirst.mockReset();
  });

  it("should reuse an active conversation by channel and customerContact first", async () => {
    mockPrisma.conversation.findFirst.mockResolvedValueOnce({
      id: "existing-conv",
      channel: "facebook",
      customerContact: "facebook:psid-1",
    });

    const { handleExternalChannelMessage } = await import("@/lib/channels/external-message");
    const { chat, createNewConversation } = await import("@/lib/ai/engine");
    const { resolveCustomer } = await import("@/lib/customer-resolver");

    const result = await handleExternalChannelMessage({
      channel: "facebook",
      customerContact: "facebook:psid-1",
      customerName: "Facebook User",
      text: " Hello ",
    });

    expect(resolveCustomer).toHaveBeenCalledWith(
      "facebook",
      "facebook:psid-1",
      "Facebook User"
    );
    expect(createNewConversation).not.toHaveBeenCalled();
    expect(chat).toHaveBeenCalledWith("existing-conv", "Hello");
    expect(result).toEqual({ conversationId: "existing-conv", response: "AI reply" });
  });

  it("should create a conversation when none exists", async () => {
    mockPrisma.conversation.findFirst.mockResolvedValue(null);

    const { handleExternalChannelMessage } = await import("@/lib/channels/external-message");
    const { chat, createNewConversation } = await import("@/lib/ai/engine");

    const result = await handleExternalChannelMessage({
      channel: "instagram",
      customerContact: "instagram:sender-1",
      customerName: "Instagram User",
      text: "Can I book?",
    });

    expect(createNewConversation).toHaveBeenCalledWith(
      "instagram",
      "Instagram User",
      "instagram:sender-1",
      "cust-1"
    );
    expect(chat).toHaveBeenCalledWith("created-conv", "Can I book?");
    expect(result.conversationId).toBe("created-conv");
  });

  it("should reject empty contact or text", async () => {
    const { handleExternalChannelMessage } = await import("@/lib/channels/external-message");

    await expect(
      handleExternalChannelMessage({
        channel: "facebook",
        customerContact: "",
        text: "Hello",
      })
    ).rejects.toThrow("Customer contact is required");

    await expect(
      handleExternalChannelMessage({
        channel: "facebook",
        customerContact: "facebook:psid-1",
        text: " ",
      })
    ).rejects.toThrow("Message text is required");
  });
});


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { handleExternalChannelMessage } from "@/lib/channels/external-message";

function buildScopedZaloContact(sourceAccountId: string, contact: string): string {
  return sourceAccountId && sourceAccountId !== "default"
    ? `zalo:${sourceAccountId}:${contact}`
    : contact;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body?.message || "").trim();
    const authorId = String(body?.authorId || "").trim();
    const threadId = String(body?.threadId || "").trim();
    const phoneNumber = String(body?.phoneNumber || "").trim();
    const accountId = String(body?.accountId || "").trim();
    const displayName = String(body?.displayName || "").trim() || "Khách Zalo";

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const customerContact = phoneNumber || authorId || threadId;
    if (!customerContact) {
      return NextResponse.json({ error: "Customer contact is required" }, { status: 400 });
    }

    let channelAccountId: string | null = null;
    let sourceAccountId = accountId;

    if (accountId && accountId !== "default") {
      const account = await prisma.channelAccount.findFirst({
        where: {
          type: "zalo",
          OR: [{ id: accountId }, { externalAccountId: accountId }],
        },
      });
      channelAccountId = account?.id ?? null;
      sourceAccountId = account?.externalAccountId || accountId;
    }

    const result = await handleExternalChannelMessage({
      channel: "zalo",
      customerContact: buildScopedZaloContact(sourceAccountId, customerContact),
      customerName: displayName,
      channelAccountId,
      sourceAccountId,
      text: message,
    });

    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      response: result.response,
    });
  } catch (error) {
    logger.error("[Zalo Incoming] Failed to process incoming message:", error);
    return NextResponse.json(
      { error: "Failed to process incoming Zalo message" },
      { status: 500 }
    );
  }
}

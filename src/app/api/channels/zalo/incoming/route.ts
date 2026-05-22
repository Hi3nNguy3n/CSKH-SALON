import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { chat, createNewConversation } from "@/lib/ai/engine";
import { resolveCustomer } from "@/lib/customer-resolver";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body?.message || "").trim();
    const authorId = String(body?.authorId || "").trim();
    const threadId = String(body?.threadId || "").trim();
    const phoneNumber = String(body?.phoneNumber || "").trim();
    const displayName = String(body?.displayName || "").trim() || "Khách Zalo";

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const customerContact = phoneNumber || authorId || threadId;
    if (!customerContact) {
      return NextResponse.json({ error: "Customer contact is required" }, { status: 400 });
    }

    const customerId = await resolveCustomer("zalo", customerContact, displayName);

    let conversation = await prisma.conversation.findFirst({
      where: {
        channel: "zalo",
        status: { in: ["active", "escalated"] },
        OR: [{ customerId }, { customerContact }],
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      conversation = await createNewConversation(
        "zalo",
        displayName,
        customerContact,
        customerId
      );
    }

    const response = await chat(conversation.id, message);

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      response,
    });
  } catch (error) {
    logger.error("[Zalo Incoming] Failed to process incoming message:", error);
    return NextResponse.json(
      { error: "Failed to process incoming Zalo message" },
      { status: 500 }
    );
  }
}


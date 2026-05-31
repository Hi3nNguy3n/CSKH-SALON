import { NextRequest, NextResponse } from "next/server";
import {
  parseMetaWebhookPayload,
  sendMetaTextMessage,
  verifyMetaSignature,
} from "@/lib/channels/meta";
import { handleExternalChannelMessage } from "@/lib/channels/external-message";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const verifyToken = process.env.META_VERIFY_TOKEN;
  if (!verifyToken) {
    return NextResponse.json(
      { error: "META_VERIFY_TOKEN is not configured" },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Invalid verify token" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const isValidSignature = verifyMetaSignature(
    rawBody,
    request.headers.get("x-hub-signature-256"),
    process.env.META_APP_SECRET
  );

  if (!isValidSignature) {
    logger.warn("[Meta Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    logger.warn("[Meta Webhook] Invalid JSON payload", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const events = parseMetaWebhookPayload(payload);

  for (const event of events) {
    try {
      const result = await handleExternalChannelMessage({
        channel: event.channel,
        customerContact: event.customerContact,
        customerName: event.customerName,
        text: event.text,
      });

      await sendMetaTextMessage({
        channel: event.channel,
        recipientId: event.senderId,
        text: result.response,
      });
    } catch (error) {
      logger.error("[Meta Webhook] Failed to process event", error, {
        channel: event.channel,
      });
    }
  }

  return NextResponse.json({ ok: true, received: events.length });
}


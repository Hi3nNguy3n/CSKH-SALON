import crypto from "crypto";
import { logger } from "@/lib/logger";

export type MetaChannel = "facebook" | "instagram";

export interface MetaInboundEvent {
  channel: MetaChannel;
  senderId: string;
  recipientId: string;
  customerContact: string;
  customerName: string;
  text: string;
  rawEvent: unknown;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNestedString(record: UnknownRecord, key: string, nestedKey: string): string {
  const nested = record[key];
  if (!isRecord(nested)) return "";
  return getString(nested[nestedKey]).trim();
}

function mapObjectToChannel(objectValue: string): MetaChannel | null {
  if (objectValue === "page") return "facebook";
  if (objectValue === "instagram") return "instagram";
  return null;
}

export function parseMetaWebhookPayload(payload: unknown): MetaInboundEvent[] {
  if (!isRecord(payload)) return [];

  const channel = mapObjectToChannel(getString(payload.object));
  if (!channel) return [];

  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  const events: MetaInboundEvent[] = [];

  for (const entry of entries) {
    if (!isRecord(entry)) continue;

    const messagingEvents = Array.isArray(entry.messaging) ? entry.messaging : [];
    for (const rawEvent of messagingEvents) {
      if (!isRecord(rawEvent)) continue;

      const message = rawEvent.message;
      if (!isRecord(message)) continue;
      if (message.is_echo === true) continue;

      const text = getString(message.text).trim();
      if (!text) continue;

      const senderId = getNestedString(rawEvent, "sender", "id");
      const recipientId = getNestedString(rawEvent, "recipient", "id");
      if (!senderId || !recipientId) continue;

      events.push({
        channel,
        senderId,
        recipientId,
        customerContact: `${channel}:${senderId}`,
        customerName: channel === "facebook" ? "Facebook User" : "Instagram User",
        text,
        rawEvent,
      });
    }
  }

  return events;
}

export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string | undefined
): boolean {
  if (!appSecret) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const receivedHex = signatureHeader.slice("sha256=".length);
  const expectedHex = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    const received = Buffer.from(receivedHex, "hex");
    const expected = Buffer.from(expectedHex, "hex");
    if (received.length !== expected.length || received.length === 0) return false;
    return crypto.timingSafeEqual(received, expected);
  } catch {
    return false;
  }
}

function getGraphVersion(): string {
  return process.env.META_GRAPH_VERSION?.trim() || "v21.0";
}

function getAccessToken(channel: MetaChannel): string {
  const envName =
    channel === "facebook" ? "FACEBOOK_PAGE_ACCESS_TOKEN" : "INSTAGRAM_ACCESS_TOKEN";
  const token = process.env[envName]?.trim();
  if (!token) {
    throw new Error(`Missing ${envName}`);
  }
  return token;
}

function getSendEndpoint(channel: MetaChannel): string {
  const version = getGraphVersion();
  const host =
    channel === "facebook" ? "https://graph.facebook.com" : "https://graph.instagram.com";
  return `${host}/${version}/me/messages`;
}

async function readResponseText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "";
  }
}

export async function sendMetaTextMessage(input: {
  channel: MetaChannel;
  recipientId: string;
  text: string;
}): Promise<void> {
  const token = getAccessToken(input.channel);
  const endpoint = getSendEndpoint(input.channel);
  const url = `${endpoint}?access_token=${encodeURIComponent(token)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: input.recipientId },
      message: { text: input.text },
    }),
  });

  if (!response.ok) {
    const errorBody = await readResponseText(response);
    logger.error("[Meta] Failed to send text message", undefined, {
      channel: input.channel,
      status: response.status,
      errorBody,
    });
    throw new Error(`Meta Send API failed with status ${response.status}`);
  }
}


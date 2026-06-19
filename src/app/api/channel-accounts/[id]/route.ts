import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { requireAuth, isAuthenticated } from "@/lib/route-auth";
import {
  getDisplayName,
  getExternalAccountId,
  mergeAccountConfigPreservingSecrets,
  sanitizeChannelAccountForClient,
} from "@/lib/channels/accounts";
import { getZaloStatus, startZaloBot, stopZaloBot } from "@/lib/channels/zalo";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request, "channels:read");
  if (!isAuthenticated(auth)) return auth;

  try {
    const { id } = await context.params;
    const account = await prisma.channelAccount.findUnique({ where: { id } });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    return NextResponse.json(sanitizeChannelAccountForClient(account));
  } catch (error) {
    logger.error("Failed to fetch channel account:", error);
    return NextResponse.json({ error: "Failed to fetch channel account" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request, "channels:update");
  if (!isAuthenticated(auth)) return auth;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const existing = await prisma.channelAccount.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const rawConfig = body.config && typeof body.config === "object" ? body.config : {};
    const config = mergeAccountConfigPreservingSecrets(existing.type, rawConfig, existing.config);
    const externalAccountId = String(
      body.externalAccountId || getExternalAccountId(existing.type, config) || existing.externalAccountId
    ).trim();
    const displayName = String(
      body.displayName || getDisplayName(existing.type, config, existing.displayName)
    ).trim();
    const isDefault = typeof body.isDefault === "boolean" ? body.isDefault : existing.isDefault;

    if (isDefault) {
      await prisma.channelAccount.updateMany({
        where: { type: existing.type, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const account = await prisma.channelAccount.update({
      where: { id },
      data: {
        externalAccountId,
        displayName,
        config: config as Prisma.InputJsonValue,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
        isDefault,
        status: typeof body.status === "string" ? body.status : undefined,
      },
    });

    return NextResponse.json(sanitizeChannelAccountForClient(account));
  } catch (error) {
    logger.error("Failed to update channel account:", error);
    return NextResponse.json({ error: "Failed to update channel account" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request, "channels:update");
  if (!isAuthenticated(auth)) return auth;

  try {
    const { id } = await context.params;
    await prisma.channelAccount.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Failed to delete channel account:", error);
    return NextResponse.json({ error: "Failed to delete channel account" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request, "channels:update");
  if (!isAuthenticated(auth)) return auth;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "").trim();
    const account = await prisma.channelAccount.findUnique({ where: { id } });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    if (!["connect", "disconnect", "test"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (account.type === "zalo") {
      if (action === "connect") {
        const status = await startZaloBot(account.config as Record<string, string>, account.id);
        return NextResponse.json({ id, type: account.type, ...status });
      }
      if (action === "disconnect") {
        const status = await stopZaloBot(account.id);
        return NextResponse.json({ id, type: account.type, ...status });
      }
      return NextResponse.json({ id, type: account.type, ...getZaloStatus(account.id) });
    }

    const nextStatus = action === "connect" || action === "test" ? "connected" : "disconnected";
    const updated = await prisma.channelAccount.update({
      where: { id },
      data: {
        status: nextStatus,
        isActive: nextStatus === "connected" ? true : account.isActive,
        lastConnectedAt: nextStatus === "connected" ? new Date() : account.lastConnectedAt,
      },
    });

    return NextResponse.json({
      ...sanitizeChannelAccountForClient(updated),
      message: `${updated.displayName || updated.type} ${nextStatus}`,
    });
  } catch (error) {
    logger.error("Failed to run channel account action:", error);
    return NextResponse.json({ error: "Failed to run channel account action" }, { status: 500 });
  }
}

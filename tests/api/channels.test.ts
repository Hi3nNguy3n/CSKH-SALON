import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { createRequest, parseJsonResponse } from "../helpers/request";

const mockPrisma = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;

function channel(type: string, config: Record<string, unknown>) {
  return {
    id: `${type}-channel`,
    type,
    isActive: true,
    config,
    status: "connected",
    createdAt: new Date("2026-05-31T00:00:00.000Z"),
    updatedAt: new Date("2026-05-31T00:00:00.000Z"),
  };
}

describe("channels API secret handling", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sanitizes Facebook and Instagram secrets in GET /api/channels", async () => {
    mockPrisma.channel.findMany.mockResolvedValue([
      channel("facebook", {
        verifyToken: "fb-verify",
        pageAccessToken: "fb-token",
        pageId: "page-1",
        graphVersion: "v25.0",
        appSecret: "fb-secret",
      }),
      channel("instagram", {
        verifyToken: "ig-verify",
        accessToken: "ig-token",
        businessAccountId: "ig-business-1",
        graphVersion: "v25.0",
        appSecret: "ig-secret",
      }),
    ]);

    const { GET } = await import("@/app/api/channels/route");
    const response = await GET(createRequest("/api/channels"));
    const data = await parseJsonResponse(response);
    const facebook = data.find((item: { type: string }) => item.type === "facebook");
    const instagram = data.find((item: { type: string }) => item.type === "instagram");
    const responseText = JSON.stringify(data);

    expect(response.status).toBe(200);
    expect(responseText).not.toContain("fb-token");
    expect(responseText).not.toContain("fb-secret");
    expect(responseText).not.toContain("ig-token");
    expect(responseText).not.toContain("ig-secret");
    expect(facebook.config).toMatchObject({
      verifyToken: "fb-verify",
      pageId: "page-1",
      graphVersion: "v25.0",
      hasPageAccessToken: true,
      hasAppSecret: true,
    });
    expect(facebook.config.pageAccessToken).toBeUndefined();
    expect(facebook.config.appSecret).toBeUndefined();
    expect(instagram.config).toMatchObject({
      verifyToken: "ig-verify",
      businessAccountId: "ig-business-1",
      graphVersion: "v25.0",
      hasAccessToken: true,
      hasAppSecret: true,
    });
    expect(instagram.config.accessToken).toBeUndefined();
    expect(instagram.config.appSecret).toBeUndefined();
  });

  it("sanitizes Facebook secrets in GET /api/channels/[type]", async () => {
    mockPrisma.channel.findUnique.mockResolvedValue(
      channel("facebook", {
        verifyToken: "fb-verify",
        pageAccessToken: "fb-token",
        pageId: "page-1",
        graphVersion: "v25.0",
        appSecret: "fb-secret",
      })
    );

    const { GET } = await import("@/app/api/channels/[type]/route");
    const response = await GET(createRequest("/api/channels/facebook"), {
      params: Promise.resolve({ type: "facebook" }),
    });
    const data = await parseJsonResponse(response);

    expect(JSON.stringify(data)).not.toContain("fb-token");
    expect(JSON.stringify(data)).not.toContain("fb-secret");
    expect(data.config).toMatchObject({
      hasPageAccessToken: true,
      hasAppSecret: true,
    });
  });

  it("preserves old Facebook secrets when PUT receives blank values", async () => {
    const existing = channel("facebook", {
      verifyToken: "old-verify",
      pageAccessToken: "old-fb-token",
      pageId: "old-page",
      graphVersion: "v21.0",
      appSecret: "old-fb-secret",
    });
    mockPrisma.channel.findUnique.mockResolvedValue(existing);
    mockPrisma.channel.upsert.mockImplementation(async (args) =>
      channel("facebook", args.update.config)
    );

    const { PUT } = await import("@/app/api/channels/[type]/route");
    const response = await PUT(
      createRequest("/api/channels/facebook", {
        method: "PUT",
        body: {
          config: {
            verifyToken: "new-verify",
            pageAccessToken: "",
            pageId: "new-page",
            graphVersion: "v25.0",
            appSecret: "********",
          },
        },
      }),
      { params: Promise.resolve({ type: "facebook" }) }
    );
    const data = await parseJsonResponse(response);

    expect(mockPrisma.channel.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          config: expect.objectContaining({
            verifyToken: "new-verify",
            pageAccessToken: "old-fb-token",
            pageId: "new-page",
            graphVersion: "v25.0",
            appSecret: "old-fb-secret",
          }),
        }),
      })
    );
    expect(JSON.stringify(data)).not.toContain("old-fb-token");
    expect(JSON.stringify(data)).not.toContain("old-fb-secret");
    expect(data.config.hasPageAccessToken).toBe(true);
    expect(data.config.hasAppSecret).toBe(true);
  });

  it("updates new Instagram secrets and non-secret fields", async () => {
    const existing = channel("instagram", {
      verifyToken: "old-verify",
      accessToken: "old-ig-token",
      businessAccountId: "old-business",
      graphVersion: "v21.0",
      appSecret: "old-ig-secret",
    });
    mockPrisma.channel.findUnique.mockResolvedValue(existing);
    mockPrisma.channel.upsert.mockImplementation(async (args) =>
      channel("instagram", args.update.config)
    );

    const { PUT } = await import("@/app/api/channels/[type]/route");
    await PUT(
      createRequest("/api/channels/instagram", {
        method: "PUT",
        body: {
          config: {
            verifyToken: "new-verify",
            accessToken: "new-ig-token",
            businessAccountId: "new-business",
            graphVersion: "v25.0",
            appSecret: "new-ig-secret",
          },
        },
      }),
      { params: Promise.resolve({ type: "instagram" }) }
    );

    expect(mockPrisma.channel.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          config: expect.objectContaining({
            verifyToken: "new-verify",
            accessToken: "new-ig-token",
            businessAccountId: "new-business",
            graphVersion: "v25.0",
            appSecret: "new-ig-secret",
          }),
        }),
      })
    );
  });

  it("preserves old Instagram secrets when PUT receives blank values", async () => {
    const existing = channel("instagram", {
      accessToken: "old-ig-token",
      appSecret: "old-ig-secret",
    });
    mockPrisma.channel.findUnique.mockResolvedValue(existing);
    mockPrisma.channel.upsert.mockImplementation(async (args) =>
      channel("instagram", args.update.config)
    );

    const { PUT } = await import("@/app/api/channels/[type]/route");
    await PUT(
      createRequest("/api/channels/instagram", {
        method: "PUT",
        body: {
          config: {
            accessToken: "",
            appSecret: "••••••••",
          },
        },
      }),
      { params: Promise.resolve({ type: "instagram" }) }
    );

    expect(mockPrisma.channel.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          config: expect.objectContaining({
            accessToken: "old-ig-token",
            appSecret: "old-ig-secret",
          }),
        }),
      })
    );
  });
});

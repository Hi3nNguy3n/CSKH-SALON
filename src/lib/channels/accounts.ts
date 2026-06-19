import { prisma } from "@/lib/prisma";
import { isBlankOrMaskedSecret, sanitizeChannelConfig } from "@/lib/channels/config";

type UnknownRecord = Record<string, unknown>;

export type AccountChannelType = "facebook" | "instagram" | "zalo" | "shopee";

export const ACCOUNT_CHANNEL_TYPES: AccountChannelType[] = [
  "facebook",
  "instagram",
  "zalo",
  "shopee",
];

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(config: unknown, key: string): string {
  if (!isRecord(config)) return "";
  const value = config[key];
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function isAccountChannelType(type: string): type is AccountChannelType {
  return ACCOUNT_CHANNEL_TYPES.includes(type as AccountChannelType);
}

export function getExternalAccountId(type: string, config: unknown): string {
  if (type === "facebook") return getString(config, "pageId") || getString(config, "externalAccountId");
  if (type === "instagram") {
    return getString(config, "businessAccountId") || getString(config, "externalAccountId");
  }
  if (type === "zalo") {
    return (
      getString(config, "accountId") ||
      getString(config, "oaId") ||
      getString(config, "phoneNumber") ||
      getString(config, "externalAccountId")
    );
  }
  if (type === "shopee") {
    return getString(config, "shopId") || getString(config, "externalAccountId");
  }
  return getString(config, "externalAccountId");
}

export function getDisplayName(type: string, config: unknown, fallback?: string): string {
  return (
    getString(config, "displayName") ||
    getString(config, "name") ||
    fallback ||
    getExternalAccountId(type, config) ||
    type
  );
}

export function sanitizeChannelAccountConfig(type: string, config: unknown): unknown {
  if (!isRecord(config)) return {};

  if (type === "zalo") {
    return {
      accountId: getString(config, "accountId"),
      oaId: getString(config, "oaId"),
      displayName: getString(config, "displayName"),
      pythonCommand: getString(config, "pythonCommand"),
      scriptPath: getString(config, "scriptPath"),
      hasCookiesInput: !isBlankOrMaskedSecret(config.cookiesInput),
    };
  }

  if (type === "shopee") {
    return {
      shopId: getString(config, "shopId"),
      displayName: getString(config, "displayName"),
      partnerId: getString(config, "partnerId"),
      hasAccessToken: !isBlankOrMaskedSecret(config.accessToken),
      hasRefreshToken: !isBlankOrMaskedSecret(config.refreshToken),
      hasPartnerKey: !isBlankOrMaskedSecret(config.partnerKey),
    };
  }

  return sanitizeChannelConfig(type, config);
}

export function sanitizeChannelAccountForClient<T extends { type: string; config: unknown }>(
  account: T
): T {
  return {
    ...account,
    config: sanitizeChannelAccountConfig(account.type, account.config),
  };
}

export function mergeAccountConfigPreservingSecrets(
  type: string,
  incomingConfig: unknown,
  existingConfig: unknown
): unknown {
  const incoming = isRecord(incomingConfig) ? incomingConfig : {};
  const existing = isRecord(existingConfig) ? existingConfig : {};
  const merged: UnknownRecord = { ...existing, ...incoming };

  const preserveSecret = (key: string) => {
    if (isBlankOrMaskedSecret(incoming[key])) {
      if (existing[key] !== undefined) {
        merged[key] = existing[key];
      } else if (incoming[key] !== undefined) {
        merged[key] = incoming[key];
      }
    }
  };

  if (type === "facebook") {
    preserveSecret("pageAccessToken");
    preserveSecret("appSecret");
  }
  if (type === "instagram") {
    preserveSecret("accessToken");
    preserveSecret("appSecret");
  }
  if (type === "zalo") {
    preserveSecret("cookiesInput");
  }
  if (type === "shopee") {
    preserveSecret("accessToken");
    preserveSecret("refreshToken");
    preserveSecret("partnerKey");
  }

  return merged;
}

export async function upsertDefaultChannelAccountFromChannel(input: {
  type: string;
  config: unknown;
  isActive?: boolean;
  status?: string;
}) {
  if (!isAccountChannelType(input.type)) return null;

  const externalAccountId = getExternalAccountId(input.type, input.config) || "default";
  const displayName = getDisplayName(input.type, input.config, externalAccountId);

  return prisma.channelAccount.upsert({
    where: {
      type_externalAccountId: {
        type: input.type,
        externalAccountId,
      },
    },
    update: {
      displayName,
      config: input.config ?? {},
      isActive: getBoolean(input.isActive, true),
      isDefault: true,
      status: input.status || undefined,
    },
    create: {
      type: input.type,
      externalAccountId,
      displayName,
      config: input.config ?? {},
      isActive: getBoolean(input.isActive, true),
      isDefault: true,
      status: input.status || "disconnected",
    },
  });
}

export async function findChannelAccount(type: AccountChannelType, externalAccountId?: string) {
  const trimmedExternalId = externalAccountId?.trim();

  if (trimmedExternalId) {
    const exact = await prisma.channelAccount.findFirst({
      where: {
        type,
        externalAccountId: trimmedExternalId,
        isActive: true,
      },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
    if (exact) return exact;
  }

  return prisma.channelAccount.findFirst({
    where: {
      type,
      isActive: true,
      OR: [{ isDefault: true }, { externalAccountId: "default" }],
    },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getChannelConfigFallback(type: string): Promise<unknown> {
  const channel = await prisma.channel.findUnique({
    where: { type },
    select: { config: true },
  });
  return channel?.config ?? {};
}

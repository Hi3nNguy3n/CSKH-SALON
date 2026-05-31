type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(config: UnknownRecord, key: string): string {
  const value = config[key];
  return typeof value === "string" ? value : "";
}

export function isBlankOrMaskedSecret(value: unknown): boolean {
  if (typeof value !== "string") return true;

  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^[*•]+$/.test(trimmed);
}

export function sanitizeChannelConfig(type: string, config: unknown): unknown {
  if (!isRecord(config)) return {};

  if (type === "facebook") {
    return {
      verifyToken: getString(config, "verifyToken"),
      pageId: getString(config, "pageId"),
      graphVersion: getString(config, "graphVersion"),
      hasPageAccessToken: !isBlankOrMaskedSecret(config.pageAccessToken),
      hasAppSecret: !isBlankOrMaskedSecret(config.appSecret),
    };
  }

  if (type === "instagram") {
    return {
      verifyToken: getString(config, "verifyToken"),
      businessAccountId: getString(config, "businessAccountId"),
      graphVersion: getString(config, "graphVersion"),
      hasAccessToken: !isBlankOrMaskedSecret(config.accessToken),
      hasAppSecret: !isBlankOrMaskedSecret(config.appSecret),
    };
  }

  return config;
}

export function sanitizeChannelForClient<T extends { type: string; config: unknown }>(
  channel: T
): T {
  return {
    ...channel,
    config: sanitizeChannelConfig(channel.type, channel.config),
  };
}

export function mergeChannelConfigPreservingSecrets(
  type: string,
  incomingConfig: unknown,
  existingConfig: unknown
): unknown {
  if (type !== "facebook" && type !== "instagram") return incomingConfig;

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

  return merged;
}

import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

type ZaloStatus = "connected" | "disconnected" | "error";

interface ZaloConfig {
  pythonCommand?: string;
  scriptPath?: string;
  cookiesInput?: string;
}

function toJsonConfig(config: ZaloConfig): Record<string, string> {
  return {
    pythonCommand: config.pythonCommand || "",
    scriptPath: config.scriptPath || "",
    cookiesInput: config.cookiesInput || "",
  };
}

interface ParsedSession {
  cookies: Record<string, string>;
  imei: string;
  userAgent?: string;
}

let zaloProcess: ChildProcessWithoutNullStreams | null = null;
let zaloStatus: ZaloStatus = "disconnected";
let zaloMessage = "Zalo bot is not running";

function getRuntimeDir(): string {
  return process.env.ZALO_RUNTIME_DIR?.trim()
    ? path.resolve(process.env.ZALO_RUNTIME_DIR)
    : path.resolve(process.cwd(), "data-runtime");
}

function resolveScriptPath(scriptPath?: string): string {
  const value = scriptPath?.trim() || "zalo_bot.py";
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

function parseCookieHeader(cookieHeader: string): Record<string, string> {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const [key, ...rest] = part.split("=");
      acc[key.trim()] = rest.join("=").trim();
      return acc;
    }, {});
}

function extractImei(cookies: Record<string, string>): string {
  const keys = new Set(["imei", "x-imei", "zalo_imei"]);
  for (const [rawKey, rawValue] of Object.entries(cookies)) {
    const key = rawKey.toLowerCase();
    const value = String(rawValue ?? "");
    if (keys.has(key) && value.trim()) return value.trim();
  }
  return "";
}

function mapCookieObject(
  cookieObject: Record<string, unknown>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(cookieObject).map(([key, value]) => [key, String(value ?? "")])
  );
}

function mapCookieArray(
  cookieArray: Array<Record<string, unknown>>
): Record<string, string> {
  return cookieArray.reduce<Record<string, string>>((acc, item) => {
    const key = String(item.key ?? item.name ?? "").trim();
    const value = String(item.value ?? "");
    if (key) acc[key] = value;
    return acc;
  }, {});
}

function parseSession(cookiesInput: string): ParsedSession {
  const trimmed = cookiesInput.trim();
  if (!trimmed) {
    throw new Error("Thiếu cookies Zalo");
  }

  let cookies: Record<string, string> = {};
  let imei = "";
  let userAgent = "";

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      cookies = mapCookieArray(parsed as Array<Record<string, unknown>>);
      imei = extractImei(cookies);
    } else if (parsed && typeof parsed === "object") {
      const objectValue = parsed as Record<string, unknown>;
      if (Array.isArray(objectValue.cookies)) {
        cookies = mapCookieArray(objectValue.cookies as Array<Record<string, unknown>>);
      } else if (objectValue.cookies && typeof objectValue.cookies === "object") {
        cookies = mapCookieObject(objectValue.cookies as Record<string, unknown>);
      } else {
        cookies = Object.fromEntries(
          Object.entries(objectValue)
            .filter(([key]) => key !== "imei" && key !== "userAgent")
            .map(([key, value]) => [key, String(value ?? "")])
        );
      }
      imei = String(objectValue.imei ?? "").trim() || extractImei(cookies);
      userAgent = String(objectValue.userAgent ?? "").trim();
    }
  } else {
    cookies = parseCookieHeader(trimmed);
    imei = extractImei(cookies);
  }

  if (Object.keys(cookies).length === 0) {
    throw new Error("Cookies Zalo không hợp lệ");
  }
  if (!imei) {
    throw new Error("Không trích xuất được imei từ cookies");
  }

  return { cookies, imei, userAgent };
}

export async function syncZaloSessionFiles(config: ZaloConfig): Promise<void> {
  const session = parseSession(config.cookiesInput || "");
  const runtimeDir = getRuntimeDir();

  await fs.mkdir(runtimeDir, { recursive: true });

  await fs.writeFile(
    path.resolve(runtimeDir, "zalo_cookies.json"),
    JSON.stringify(session.cookies, null, 2),
    "utf8"
  );
  await fs.writeFile(
    path.resolve(runtimeDir, "zalo_imei.json"),
    JSON.stringify({ imei: session.imei }, null, 2),
    "utf8"
  );
  if (session.userAgent) {
    await fs.writeFile(
      path.resolve(runtimeDir, "zalo_user_agent.json"),
      JSON.stringify({ userAgent: session.userAgent }, null, 2),
      "utf8"
    );
  }
}

export function getZaloStatus() {
  return {
    status: zaloStatus,
    message: zaloMessage,
    pid: zaloProcess?.pid ?? null,
  };
}

export async function startZaloBot(config: ZaloConfig) {
  if (zaloProcess && !zaloProcess.killed) {
    return getZaloStatus();
  }

  await syncZaloSessionFiles(config);

  const pythonCommand = config.pythonCommand?.trim() || "python3";
  const scriptPath = resolveScriptPath(config.scriptPath);

  zaloStatus = "disconnected";
  zaloMessage = `Starting Zalo bot with ${pythonCommand}...`;

  const child = spawn(pythonCommand, [scriptPath], {
    cwd: process.cwd(),
    env: process.env,
  });

  zaloProcess = child;

  child.stdout.on("data", (data: Buffer) => {
    const text = data.toString().trim();
    if (text) logger.info(`[Zalo] ${text}`);
  });

  child.stderr.on("data", (data: Buffer) => {
    const text = data.toString().trim();
    if (text) logger.error(`[Zalo] ${text}`);
  });

  child.once("spawn", async () => {
    zaloStatus = "connected";
    zaloMessage = "Zalo bot is running";
    await prisma.channel.upsert({
      where: { type: "zalo" },
      update: { isActive: true, status: "connected" },
      create: {
        type: "zalo",
        isActive: true,
        status: "connected",
        config: toJsonConfig(config),
      },
    });
  });

  child.once("exit", async (code, signal) => {
    zaloProcess = null;
    zaloStatus = code === 0 || signal === "SIGTERM" ? "disconnected" : "error";
    zaloMessage =
      code === 0 || signal === "SIGTERM"
        ? "Zalo bot stopped"
        : `Zalo bot exited unexpectedly (code=${code ?? "null"})`;

    await prisma.channel.upsert({
      where: { type: "zalo" },
      update: { status: "disconnected", isActive: false },
      create: {
        type: "zalo",
        isActive: false,
        status: "disconnected",
        config: toJsonConfig(config),
      },
    });
  });

  return getZaloStatus();
}

export async function stopZaloBot() {
  if (zaloProcess && !zaloProcess.killed) {
    zaloProcess.kill("SIGTERM");
  }

  zaloProcess = null;
  zaloStatus = "disconnected";
  zaloMessage = "Zalo bot stopped";

  await prisma.channel.upsert({
    where: { type: "zalo" },
    update: { isActive: false, status: "disconnected" },
    create: { type: "zalo", isActive: false, status: "disconnected", config: {} },
  });

  return getZaloStatus();
}

export async function sendZaloMessage(
  config: ZaloConfig,
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; output: string }> {
  await syncZaloSessionFiles(config);

  const pythonCommand = config.pythonCommand?.trim() || "python3";
  const scriptPath = resolveScriptPath(config.scriptPath);

  return new Promise((resolve, reject) => {
    const child = spawn(
      pythonCommand,
      [scriptPath, "send", "--phone", phoneNumber, "--message", message],
      {
        cwd: process.cwd(),
        env: process.env,
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.once("error", (error) => {
      reject(error);
    });

    child.once("close", (code) => {
      const output = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
      if (code === 0) {
        resolve({ success: true, output });
        return;
      }
      reject(new Error(output || `Zalo send failed with code ${code ?? "null"}`));
    });
  });
}

export async function sendZaloImageMessage(
  config: ZaloConfig,
  phoneNumber: string,
  message: string,
  imagePath: string
): Promise<{ success: boolean; output: string }> {
  await syncZaloSessionFiles(config);

  const pythonCommand = config.pythonCommand?.trim() || "python3";
  const scriptPath = resolveScriptPath(config.scriptPath);

  return new Promise((resolve, reject) => {
    const child = spawn(
      pythonCommand,
      [
        scriptPath,
        "send-image",
        "--phone",
        phoneNumber,
        "--message",
        message,
        "--image",
        imagePath,
      ],
      {
        cwd: process.cwd(),
        env: process.env,
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.once("error", (error) => {
      reject(error);
    });

    child.once("close", (code) => {
      const output = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
      if (code === 0) {
        resolve({ success: true, output });
        return;
      }
      reject(new Error(output || `Zalo image send failed with code ${code ?? "null"}`));
    });
  });
}

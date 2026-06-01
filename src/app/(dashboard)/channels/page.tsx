"use client";

import { Header } from "@/components/layout/header";
import Link from "next/link";
import {
  MessageCircle,
  Mail,
  Phone,
  Wifi,
  WifiOff,
  Save,
  Loader2,
  QrCode,
  Key,
  TestTube,
  PhoneCall,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChannelData {
  id: string | null;
  type: string;
  isActive: boolean;
  config: Record<string, unknown>;
  status: string;
  qr?: string | null;
}

type WhatsAppMode = "web" | "api";
const CHANNELS_PER_PAGE = 4;
const CHANNEL_PAGE_ORDER = ["whatsapp", "email", "phone", "zalo", "facebook", "instagram"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const isConnected = status === "connected";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
        isConnected
          ? "bg-owly-success/10 text-owly-success"
          : "bg-owly-danger/10 text-owly-danger"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isConnected ? "bg-owly-success" : "bg-owly-danger"
        )}
      />
      {isConnected ? "Đã kết nối" : "Chưa kết nối"}
    </span>
  );
}

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:ring-offset-2",
        enabled ? "bg-owly-primary" : "bg-owly-border"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  isSecret = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  isSecret?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="block text-xs font-medium text-owly-text-light mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={isSecret && !visible ? "password" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg text-owly-text placeholder:text-owly-text-light/50 focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-colors"
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-owly-text-light hover:text-owly-text transition-colors"
          >
            {visible ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WhatsApp Card
// ---------------------------------------------------------------------------

function WhatsAppCard({
  channel,
  onSave,
  onAction,
  saving,
}: {
  channel: ChannelData;
  onSave: (type: string, config: Record<string, unknown>, isActive: boolean) => void;
  onAction: (type: string, action: string) => void;
  saving: boolean;
}) {
  const cfg = channel.config as Record<string, string>;
  const [isActive, setIsActive] = useState(channel.isActive);
  const [mode, setMode] = useState<WhatsAppMode>(
    (cfg.mode as WhatsAppMode) || "web"
  );
  const [apiKey, setApiKey] = useState(cfg.apiKey || "");
  const [phoneNumber, setPhoneNumber] = useState(cfg.phoneNumber || "");
  const isConnected = channel.status === "connected";

  return (
    <div className="bg-owly-surface rounded-xl border border-owly-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-owly-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-owly-text">WhatsApp</h3>
              <p className="text-xs text-owly-text-light mt-0.5">
                Messaging via WhatsApp Web or API
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={channel.status} />
            <Toggle enabled={isActive} onChange={setIsActive} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Mode selector */}
        <div>
          <label className="block text-xs font-medium text-owly-text-light mb-2">
            Connection Method
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("web")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors",
                mode === "web"
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-owly-border bg-owly-bg text-owly-text-light hover:bg-owly-primary-50 hover:text-owly-text"
              )}
            >
              <QrCode className="h-4 w-4" />
              WhatsApp Web
            </button>
            <button
              type="button"
              onClick={() => setMode("api")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors",
                mode === "api"
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-owly-border bg-owly-bg text-owly-text-light hover:bg-owly-primary-50 hover:text-owly-text"
              )}
            >
              <Key className="h-4 w-4" />
              API
            </button>
          </div>
        </div>

        {mode === "web" ? (
          <div>
            {isConnected ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Session Active
                  </span>
                </div>
                {phoneNumber && (
                  <p className="text-sm text-green-600">
                    Phone: {phoneNumber}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onAction("whatsapp", "disconnect")}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <WifiOff className="h-3.5 w-3.5" />
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-owly-border bg-owly-bg p-6 flex flex-col items-center">
                <div className="w-40 h-40 bg-white border-2 border-dashed border-owly-border rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                  {channel.qr ? (
                    <img src={channel.qr} alt="WhatsApp QR Code" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center">
                      <QrCode className="h-10 w-10 text-owly-text-light/40 mx-auto mb-1" />
                      <p className="text-xs text-owly-text-light/60">QR Code</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-owly-text-light text-center max-w-[220px]">
                  {channel.qr ? "Quét mã QR này bằng WhatsApp để kết nối." : "Bấm Kết nối để tạo mã QR."}
                </p>
                <button
                  type="button"
                  onClick={() => onAction("whatsapp", "connect")}
                  className="mt-3 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Wifi className="h-4 w-4" />
                  Connect
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <FieldInput
              label="API Key"
              value={apiKey}
              onChange={setApiKey}
              placeholder="Enter your WhatsApp API key"
              isSecret
            />
            <FieldInput
              label="Phone Number"
              value={phoneNumber}
              onChange={setPhoneNumber}
              placeholder="+1234567890"
            />
            {isConnected && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  API connected - Phone: {phoneNumber || "N/A"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-owly-border bg-owly-bg/50">
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            onSave(
              "whatsapp",
              { mode, apiKey, phoneNumber },
              isActive
            )
          }
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-owly-primary rounded-lg hover:bg-owly-primary-dark disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Email Card
// ---------------------------------------------------------------------------

function EmailCard({
  channel,
  onSave,
  onAction,
  saving,
}: {
  channel: ChannelData;
  onSave: (type: string, config: Record<string, unknown>, isActive: boolean) => void;
  onAction: (type: string, action: string) => void;
  saving: boolean;
}) {
  const cfg = channel.config as Record<string, string>;
  const [isActive, setIsActive] = useState(channel.isActive);

  const [smtpHost, setSmtpHost] = useState(cfg.smtpHost || "");
  const [smtpPort, setSmtpPort] = useState(cfg.smtpPort || "587");
  const [smtpUser, setSmtpUser] = useState(cfg.smtpUser || "");
  const [smtpPass, setSmtpPass] = useState(cfg.smtpPass || "");
  const [smtpFrom, setSmtpFrom] = useState(cfg.smtpFrom || "");

  const [imapHost, setImapHost] = useState(cfg.imapHost || "");
  const [imapPort, setImapPort] = useState(cfg.imapPort || "993");
  const [imapUser, setImapUser] = useState(cfg.imapUser || "");
  const [imapPass, setImapPass] = useState(cfg.imapPass || "");

  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    setTestResult(null);
    onAction("email", "test");
    setTestResult("Test initiated - check server logs for results");
    setTimeout(() => setTestResult(null), 4000);
  };

  return (
    <div className="bg-owly-surface rounded-xl border border-owly-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-owly-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-owly-text">Email</h3>
              <p className="text-xs text-owly-text-light mt-0.5">
                Send and receive via SMTP / IMAP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={channel.status} />
            <Toggle enabled={isActive} onChange={setIsActive} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* SMTP */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-owly-text-light mb-3">
            SMTP Settings (Outgoing)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <FieldInput
              label="Host"
              value={smtpHost}
              onChange={setSmtpHost}
              placeholder="smtp.example.com"
            />
            <FieldInput
              label="Port"
              value={smtpPort}
              onChange={setSmtpPort}
              placeholder="587"
              type="text"
            />
            <FieldInput
              label="Username"
              value={smtpUser}
              onChange={setSmtpUser}
              placeholder="user@example.com"
            />
            <FieldInput
              label="Password"
              value={smtpPass}
              onChange={setSmtpPass}
              placeholder="Password"
              isSecret
            />
          </div>
          <div className="mt-3">
            <FieldInput
              label="From Address"
              value={smtpFrom}
              onChange={setSmtpFrom}
              placeholder="noreply@example.com"
            />
          </div>
        </div>

        {/* IMAP */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-owly-text-light mb-3">
            IMAP Settings (Incoming)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <FieldInput
              label="Host"
              value={imapHost}
              onChange={setImapHost}
              placeholder="imap.example.com"
            />
            <FieldInput
              label="Port"
              value={imapPort}
              onChange={setImapPort}
              placeholder="993"
              type="text"
            />
            <FieldInput
              label="Username"
              value={imapUser}
              onChange={setImapUser}
              placeholder="user@example.com"
            />
            <FieldInput
              label="Password"
              value={imapPass}
              onChange={setImapPass}
              placeholder="Password"
              isSecret
            />
          </div>
        </div>

        {/* Test result */}
        {testResult && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700">{testResult}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-owly-border bg-owly-bg/50 flex items-center gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            onSave(
              "email",
              {
                smtpHost,
                smtpPort,
                smtpUser,
                smtpPass,
                smtpFrom,
                imapHost,
                imapPort,
                imapUser,
                imapPass,
              },
              isActive
            )
          }
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-owly-primary rounded-lg hover:bg-owly-primary-dark disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
        <button
          type="button"
          onClick={handleTest}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <TestTube className="h-4 w-4" />
          Test Connection
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phone Card
// ---------------------------------------------------------------------------

function PhoneCard({
  channel,
  onSave,
  onAction,
  saving,
}: {
  channel: ChannelData;
  onSave: (type: string, config: Record<string, unknown>, isActive: boolean) => void;
  onAction: (type: string, action: string) => void;
  saving: boolean;
}) {
  const cfg = channel.config as Record<string, string>;
  const [isActive, setIsActive] = useState(channel.isActive);

  const [twilioSid, setTwilioSid] = useState(cfg.twilioSid || "");
  const [twilioToken, setTwilioToken] = useState(cfg.twilioToken || "");
  const [twilioPhone, setTwilioPhone] = useState(cfg.twilioPhone || "");

  const [elevenLabsKey, setElevenLabsKey] = useState(cfg.elevenLabsKey || "");
  const [elevenLabsVoice, setElevenLabsVoice] = useState(
    cfg.elevenLabsVoice || ""
  );

  const voiceOptions = [
    { id: "", label: "Select a voice..." },
    { id: "rachel", label: "Rachel - Calm, professional" },
    { id: "drew", label: "Drew - Friendly, warm" },
    { id: "clyde", label: "Clyde - Authoritative" },
    { id: "domi", label: "Domi - Energetic, upbeat" },
    { id: "bella", label: "Bella - Soft, gentle" },
  ];

  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestCall = () => {
    setTestResult(null);
    onAction("phone", "test");
    setTestResult("Test call initiated - check Twilio dashboard for status");
    setTimeout(() => setTestResult(null), 4000);
  };

  return (
    <div className="bg-owly-surface rounded-xl border border-owly-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-owly-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-owly-text">Phone</h3>
              <p className="text-xs text-owly-text-light mt-0.5">
                Voice calls via Twilio and ElevenLabs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={channel.status} />
            <Toggle enabled={isActive} onChange={setIsActive} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* Twilio */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-owly-text-light mb-3">
            Twilio Settings
          </h4>
          <div className="space-y-3">
            <FieldInput
              label="Account SID"
              value={twilioSid}
              onChange={setTwilioSid}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <FieldInput
              label="Auth Token"
              value={twilioToken}
              onChange={setTwilioToken}
              placeholder="Your Twilio auth token"
              isSecret
            />
            <FieldInput
              label="Phone Number"
              value={twilioPhone}
              onChange={setTwilioPhone}
              placeholder="+1234567890"
            />
          </div>
        </div>

        {/* ElevenLabs */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-owly-text-light mb-3">
            ElevenLabs Voice
          </h4>
          <div className="space-y-3">
            <FieldInput
              label="API Key"
              value={elevenLabsKey}
              onChange={setElevenLabsKey}
              placeholder="Your ElevenLabs API key"
              isSecret
            />
            <div>
              <label className="block text-xs font-medium text-owly-text-light mb-1">
                Voice
              </label>
              <select
                value={elevenLabsVoice}
                onChange={(e) => setElevenLabsVoice(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg text-owly-text focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-colors"
              >
                {voiceOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Test result */}
        {testResult && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-700">{testResult}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-owly-border bg-owly-bg/50 flex items-center gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            onSave(
              "phone",
              {
                twilioSid,
                twilioToken,
                twilioPhone,
                elevenLabsKey,
                elevenLabsVoice,
              },
              isActive
            )
          }
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-owly-primary rounded-lg hover:bg-owly-primary-dark disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
        <button
          type="button"
          onClick={handleTestCall}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <PhoneCall className="h-4 w-4" />
          Test Call
        </button>
      </div>
    </div>
  );
}

function ZaloCard({
  channel,
  onSave,
  onAction,
  saving,
}: {
  channel: ChannelData;
  onSave: (type: string, config: Record<string, unknown>, isActive: boolean) => void;
  onAction: (type: string, action: string) => void;
  saving: boolean;
}) {
  const cfg = channel.config as Record<string, string>;
  const [isActive, setIsActive] = useState(channel.isActive);
  const [pythonCommand, setPythonCommand] = useState(cfg.pythonCommand || "python3");
  const [scriptPath, setScriptPath] = useState(cfg.scriptPath || "zalo_bot.py");
  const [cookiesInput, setCookiesInput] = useState(cfg.cookiesInput || "");
  const isConnected = channel.status === "connected";

  return (
    <div className="bg-owly-surface rounded-xl border border-owly-border overflow-hidden">
      <div className="px-5 py-4 border-b border-owly-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-cyan-50 text-cyan-600">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-owly-text">Zalo</h3>
              <p className="text-xs text-owly-text-light mt-0.5">
                Listener cho chatbot và gửi tin nhắn qua Zalo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={channel.status} />
            <Toggle enabled={isActive} onChange={setIsActive} />
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <FieldInput
          label="Python Command"
          value={pythonCommand}
          onChange={setPythonCommand}
          placeholder="python3"
        />
        <FieldInput
          label="Script Path"
          value={scriptPath}
          onChange={setScriptPath}
          placeholder="zalo_bot.py"
        />
        <div>
          <label className="block text-xs font-medium text-owly-text-light mb-1">
            Cookies
          </label>
          <textarea
            value={cookiesInput}
            onChange={(e) => setCookiesInput(e.target.value)}
            rows={6}
            placeholder='{"cookies": {...}, "imei": "...", "userAgent": "..."}'
            className="w-full px-3 py-2 text-sm border border-owly-border rounded-lg bg-owly-bg text-owly-text placeholder:text-owly-text-light/50 focus:outline-none focus:ring-2 focus:ring-owly-primary/30 focus:border-owly-primary transition-colors resize-none"
          />
        </div>

        {isConnected ? (
          <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-cyan-600" />
            <span className="text-sm text-cyan-700">
              Zalo listener đang chạy
            </span>
          </div>
        ) : null}
      </div>

      <div className="px-5 py-3 border-t border-owly-border bg-owly-bg/50 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            onSave(
              "zalo",
              { pythonCommand, scriptPath, cookiesInput },
              isActive
            )
          }
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-owly-primary rounded-lg hover:bg-owly-primary-dark disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
        <button
          type="button"
          onClick={() => onAction("zalo", isConnected ? "disconnect" : "connect")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            isConnected
              ? "text-red-600 bg-red-50 border border-red-200 hover:bg-red-100"
              : "text-cyan-700 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100"
          )}
        >
          {isConnected ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
          {isConnected ? "Disconnect" : "Connect"}
        </button>
        <button
          type="button"
          onClick={() => onAction("zalo", "test")}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors"
        >
          <TestTube className="h-4 w-4" />
          Test
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta Channel Card
// ---------------------------------------------------------------------------

type MetaChannelType = "facebook" | "instagram";

function MetaReadinessBadge({
  isActive,
  hasAccessToken,
}: {
  isActive: boolean;
  hasAccessToken: boolean;
}) {
  const label = hasAccessToken ? (isActive ? "Đã bật" : "Đã cấu hình") : "Thiếu token";
  const isReady = hasAccessToken && isActive;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        isReady
          ? "bg-owly-success/10 text-owly-success"
          : hasAccessToken
            ? "bg-amber-50 text-amber-700"
            : "bg-owly-danger/10 text-owly-danger"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isReady ? "bg-owly-success" : hasAccessToken ? "bg-amber-500" : "bg-owly-danger"
        )}
      />
      {label}
    </span>
  );
}

function SecretIndicator({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-owly-border bg-owly-bg px-3 py-2">
      <span className="text-xs font-medium text-owly-text-light">{label}</span>
      <span
        className={cn(
          "text-xs font-medium",
          enabled ? "text-owly-success" : "text-owly-danger"
        )}
      >
        {enabled ? "Đã có" : "Chưa có"}
      </span>
    </div>
  );
}

function MetaChannelCard({
  channel,
  type,
  onSave,
  saving,
}: {
  channel: ChannelData;
  type: MetaChannelType;
  onSave: (type: string, config: Record<string, unknown>, isActive: boolean) => void;
  saving: boolean;
}) {
  const cfg = channel.config as Record<string, string | boolean>;
  const isFacebook = type === "facebook";
  const [isActive, setIsActive] = useState(channel.isActive);
  const [verifyToken, setVerifyToken] = useState(String(cfg.verifyToken || ""));
  const [accountId, setAccountId] = useState(
    String(isFacebook ? cfg.pageId || "" : cfg.businessAccountId || "")
  );
  const [graphVersion, setGraphVersion] = useState(String(cfg.graphVersion || "v25.0"));
  const hasAccessToken = Boolean(
    isFacebook ? cfg.hasPageAccessToken : cfg.hasAccessToken
  );
  const hasAppSecret = Boolean(cfg.hasAppSecret);
  const title = isFacebook ? "Facebook Messenger" : "Instagram Direct";
  const description = isFacebook
    ? "Nhận và trả lời tin nhắn từ Facebook Page"
    : "Nhận và trả lời tin nhắn Instagram Direct";

  return (
    <div className="bg-owly-surface rounded-xl border border-owly-border overflow-hidden">
      <div className="px-5 py-4 border-b border-owly-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "p-2.5 rounded-lg",
                isFacebook ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
              )}
            >
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-owly-text">{title}</h3>
              <p className="text-xs text-owly-text-light mt-0.5">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <MetaReadinessBadge isActive={isActive} hasAccessToken={hasAccessToken} />
            <Toggle enabled={isActive} onChange={setIsActive} />
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-lg border border-owly-primary/20 bg-owly-primary-50/40 p-3">
          <p className="text-xs text-owly-text">
            Webhook dùng chung: <span className="font-mono">/api/webhooks/meta</span>
          </p>
        </div>

        <FieldInput
          label="Webhook Verify Token"
          value={verifyToken}
          onChange={setVerifyToken}
          placeholder="meta-test-token-123"
          isSecret
        />
        <FieldInput
          label={isFacebook ? "Page ID" : "Instagram Business Account ID"}
          value={accountId}
          onChange={setAccountId}
          placeholder={isFacebook ? "1234567890" : "17841400000000000"}
        />
        <FieldInput
          label="Graph API Version"
          value={graphVersion}
          onChange={setGraphVersion}
          placeholder="v25.0"
        />

        <div className="grid grid-cols-2 gap-3">
          <SecretIndicator
            label={isFacebook ? "Page Token" : "Access Token"}
            enabled={hasAccessToken}
          />
          <SecretIndicator label="App Secret" enabled={hasAppSecret} />
        </div>
      </div>

      <div className="px-5 py-3 border-t border-owly-border bg-owly-bg/50 flex items-center gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            onSave(
              type,
              {
                verifyToken,
                graphVersion,
                ...(isFacebook
                  ? { pageId: accountId }
                  : { businessAccountId: accountId }),
              },
              isActive
            )
          }
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-owly-primary rounded-lg hover:bg-owly-primary-dark disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
        <Link
          href="/settings"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-owly-primary bg-owly-primary-50 border border-owly-primary/20 rounded-lg hover:bg-owly-primary-100 transition-colors"
        >
          <Key className="h-4 w-4" />
          Cấu hình secret
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/channels");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const [whatsappRes, zaloRes] = await Promise.all([
        fetch("/api/channels/whatsapp"),
        fetch("/api/channels/zalo"),
      ]);
      const whatsappLive = whatsappRes.ok ? await whatsappRes.json() : null;
      const zaloLive = zaloRes.ok ? await zaloRes.json() : null;

      setChannels(
        data.map((channel: ChannelData) =>
          channel.type === "whatsapp" && whatsappLive
            ? { ...channel, status: whatsappLive.status, qr: whatsappLive.qr }
            : channel.type === "zalo" && zaloLive
              ? { ...channel, status: zaloLive.status }
            : channel
        )
      );
    } catch {
      showToast("Failed to load channels", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Poll channel live status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [waRes, zaloRes] = await Promise.all([
          fetch("/api/channels/whatsapp"),
          fetch("/api/channels/zalo"),
        ]);

        if (waRes.ok) {
          const live = await waRes.json();
          setChannels(prev => {
            const wa = prev.find(ch => ch.type === "whatsapp");
            if (wa?.status === "connected" && live.status === "connected") return prev;
            return prev.map(ch => 
              ch.type === "whatsapp" 
                ? { ...ch, status: live.status, qr: live.qr }
                : ch
            );
          });
        }

        if (zaloRes.ok) {
          const live = await zaloRes.json();
          setChannels((prev) =>
            prev.map((ch) =>
              ch.type === "zalo" ? { ...ch, status: live.status } : ch
            )
          );
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async (
    type: string,
    config: Record<string, unknown>,
    isActive: boolean
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${type}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, isActive }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setChannels((prev) =>
        prev.map((ch) => (ch.type === type ? updated : ch))
      );
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} settings saved`);
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (type: string, action: string) => {
    try {
      const res = await fetch(`/api/channels/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }
      const data = await res.json();
      await fetchChannels();
      showToast(data.message || "Action completed");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Action failed",
        "error"
      );
    }
  };

  const getChannel = (type: string): ChannelData =>
    channels.find((ch) => ch.type === type) || {
      id: null,
      type,
      isActive: false,
      config: {},
      status: "disconnected",
    };

  const totalPages = Math.ceil(CHANNEL_PAGE_ORDER.length / CHANNELS_PER_PAGE);
  const visibleChannelTypes = CHANNEL_PAGE_ORDER.slice(
    (currentPage - 1) * CHANNELS_PER_PAGE,
    currentPage * CHANNELS_PER_PAGE
  );

  const renderChannelCard = (type: string) => {
    if (type === "whatsapp") {
      return (
        <WhatsAppCard
          key={type}
          channel={getChannel("whatsapp")}
          onSave={handleSave}
          onAction={handleAction}
          saving={saving}
        />
      );
    }

    if (type === "email") {
      return (
        <EmailCard
          key={type}
          channel={getChannel("email")}
          onSave={handleSave}
          onAction={handleAction}
          saving={saving}
        />
      );
    }

    if (type === "phone") {
      return (
        <PhoneCard
          key={type}
          channel={getChannel("phone")}
          onSave={handleSave}
          onAction={handleAction}
          saving={saving}
        />
      );
    }

    if (type === "zalo") {
      return (
        <ZaloCard
          key={type}
          channel={getChannel("zalo")}
          onSave={handleSave}
          onAction={handleAction}
          saving={saving}
        />
      );
    }

    if (type === "facebook" || type === "instagram") {
      return (
        <MetaChannelCard
          key={type}
          channel={getChannel(type)}
          type={type}
          onSave={handleSave}
          saving={saving}
        />
      );
    }

    return null;
  };

  return (
    <>
      <Header
        title="Kênh liên hệ"
        description="Connect and manage your communication channels"
      />

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-owly-primary" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl">
              {visibleChannelTypes.map(renderChannelCard)}
            </div>

            <div className="flex items-center justify-between max-w-7xl border-t border-owly-border pt-4">
              <p className="text-sm text-owly-text-light">
                Trang {currentPage} / {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-owly-text bg-owly-surface border border-owly-border rounded-lg hover:bg-owly-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-owly-text bg-owly-surface border border-owly-border rounded-lg hover:bg-owly-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all animate-in slide-in-from-bottom-4 duration-300",
            toast.type === "success"
              ? "bg-owly-success text-white"
              : "bg-owly-danger text-white"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}
    </>
  );
}

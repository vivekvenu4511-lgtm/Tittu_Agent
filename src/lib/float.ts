import { invoke } from "@tauri-apps/api/core";

export async function registerGlobalShortcut(): Promise<void> {
  return invoke("register_global_shortcut");
}

export async function showFloatWindow(): Promise<void> {
  return invoke("show_float_window");
}

export async function hideFloatWindow(): Promise<void> {
  return invoke("hide_float_window");
}

export async function getForegroundApp(): Promise<string> {
  return invoke<string>("get_foreground_app");
}

export async function getClipboardText(): Promise<string> {
  return invoke<string>("get_clipboard_text");
}

export interface SystemContext {
  foregroundApp: string;
  clipboard: string;
}

export async function getSystemContext(): Promise<SystemContext> {
  const [foregroundApp, clipboard] = await Promise.all([
    getForegroundApp(),
    getClipboardText(),
  ]);
  return { foregroundApp, clipboard };
}

export function formatSystemContext(ctx: SystemContext): string {
  const parts: string[] = [];
  if (ctx.foregroundApp) {
    parts.push(`Current app: ${ctx.foregroundApp}`);
  }
  if (ctx.clipboard && ctx.clipboard.length < 500) {
    parts.push(`Clipboard: ${ctx.clipboard.slice(0, 200)}`);
  }
  return parts.length > 0 ? `[System Context]\n${parts.join("\n")}` : "";
}

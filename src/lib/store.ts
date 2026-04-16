import type { Message, Settings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const STORAGE_KEY = "tittu_settings";
const HISTORY_KEY = "tittu_chat_history";

export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as Settings;
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function loadChatHistory(): Message[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored) as Message[];
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveChatHistory(messages: Message[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
}

export function clearChatHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

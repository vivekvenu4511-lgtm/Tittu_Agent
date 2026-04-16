import type { Message, Settings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import {
  loadSettings as loadSettingsRust,
  saveSettings as saveSettingsRust,
} from "./api";

const STORAGE_KEY = "tittu_settings";
const HISTORY_KEY = "tittu_chat_history";

function settingsToRust(s: Settings) {
  return {
    openrouter_api_key: s.openRouterApiKey,
    openai_api_key: s.openaiApiKey,
    selected_provider: s.selectedProvider,
    selected_model: s.selectedModel,
    ollama_models: s.ollamaModels,
    temperature: s.temperature,
    max_tokens: s.maxTokens,
    theme: s.theme,
    font: s.font,
  };
}

function rustToSettings(r: {
  openrouter_api_key: string;
  openai_api_key: string;
  selected_provider: string;
  selected_model: string;
  ollama_models: string[];
  temperature: number;
  max_tokens: number;
  theme: string;
  font: string;
}): Settings {
  return {
    openRouterApiKey: r.openrouter_api_key ?? "",
    openaiApiKey: r.openai_api_key ?? "",
    selectedProvider: r.selected_provider ?? "ollama",
    selectedModel: r.selected_model ?? "deepseek-r1:8b",
    ollamaModels: r.ollama_models ?? [],
    temperature: r.temperature ?? 0.7,
    maxTokens: r.max_tokens ?? 2048,
    theme: r.theme ?? "golden",
    font: r.font ?? "inter",
  };
}

export async function loadSettings(): Promise<Settings> {
  try {
    const rust = await loadSettingsRust();
    const settings = rustToSettings(rust);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return settings;
  } catch {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as Settings;
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  }
}

export function loadSettingsSync(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as Settings;
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  try {
    await saveSettingsRust(settingsToRust(settings));
  } catch {
    // Tauri may not be running in dev without backend
  }
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

import { invoke } from "@tauri-apps/api/core";
import type { Message } from "./types";

interface RustChatMessage {
  role: string;
  content: string;
}

interface RustGenerateRequest {
  provider: string;
  model: string;
  messages: RustChatMessage[];
  temperature: number | null;
  max_tokens: number | null;
}

interface RustGenerateResponse {
  content: string;
  model: string;
}

export async function generate(
  provider: string,
  model: string,
  messages: Message[],
  temperature?: number,
  maxTokens?: number,
): Promise<string> {
  const rustMessages: RustChatMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const req: RustGenerateRequest = {
    provider,
    model,
    messages: rustMessages,
    temperature: temperature ?? null,
    max_tokens: maxTokens ?? null,
  };
  const resp: RustGenerateResponse = await invoke("generate", { request: req });
  return resp.content;
}

export async function listProviders(): Promise<string[]> {
  return invoke<string[]>("list_providers");
}

export async function checkProviderHealth(provider: string): Promise<boolean> {
  return invoke<boolean>("check_provider_health", { provider });
}

export async function listOllamaModels(
  baseUrl?: string,
): Promise<{ name: string }[]> {
  return invoke<{ name: string }[]>("list_ollama_models", {
    baseUrl: baseUrl ?? null,
  });
}

export async function checkOllamaStatus(baseUrl?: string): Promise<boolean> {
  return invoke<boolean>("check_ollama_status", {
    baseUrl: baseUrl ?? null,
  });
}

interface RustSettings {
  openrouter_api_key: string;
  openai_api_key: string;
  selected_provider: string;
  selected_model: string;
  ollama_models: string[];
  temperature: number;
  max_tokens: number;
  theme: string;
  font: string;
}

export async function loadSettings(): Promise<RustSettings> {
  return invoke<RustSettings>("load_settings");
}

export async function saveSettings(settings: RustSettings): Promise<void> {
  return invoke("save_settings", { settings });
}

export async function getSettingsPath(): Promise<string> {
  return invoke<string>("get_settings_path");
}

function buildOllamaMessages(messages: Message[]) {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

export async function chatWithOllama(
  model: string,
  messages: Message[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/ollama/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: buildOllamaMessages(messages),
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama error ${response.status}: ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.message?.content) {
          fullText += data.message.content;
          onChunk(data.message.content);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return fullText;
}

export async function chatWithOpenRouter(
  model: string,
  messages: Message[],
  apiKey: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/openrouter/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: buildOllamaMessages(messages),
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter(Boolean);

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const dataStr = line.slice(6).trim();
      if (dataStr === "[DONE]") break;

      try {
        const data = JSON.parse(dataStr);
        const content = data.choices?.[0]?.delta?.content;
        if (content) {
          fullText += content;
          onChunk(content);
        }
      } catch {
        // skip
      }
    }
  }

  return fullText;
}

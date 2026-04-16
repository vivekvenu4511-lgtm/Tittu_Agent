export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export type ModelProvider = "ollama" | "openrouter";

export interface Model {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
}

export interface Settings {
  openRouterApiKey: string;
  openaiApiKey: string;
  selectedProvider: string;
  selectedModel: string;
  ollamaModels: string[];
  temperature: number;
  maxTokens: number;
  theme: string;
  font: string;
}

export const DEFAULT_OLLAMA_MODELS = [
  "deepseek-r1:8b",
  "qwen2.5:latest",
  "gemma3:latest",
  "llama3.2:latest",
  "llama3.1:latest",
  "deepseek-r1:1.5b",
];

export const DEFAULT_SETTINGS: Settings = {
  openRouterApiKey: "",
  openaiApiKey: "",
  selectedProvider: "ollama",
  selectedModel: "deepseek-r1:8b",
  ollamaModels: DEFAULT_OLLAMA_MODELS,
  temperature: 0.7,
  maxTokens: 2048,
  theme: "golden",
  font: "inter",
};

export const MODEL_MAP: Record<string, Model> = {
  "deepseek-r1:8b": {
    id: "deepseek-r1:8b",
    name: "DeepSeek R1 8B",
    provider: "ollama",
    description: "Strong reasoning, good for code and analysis",
  },
  "qwen2.5:latest": {
    id: "qwen2.5:latest",
    name: "Qwen 2.5",
    provider: "ollama",
    description: "Fast, broad knowledge, multilingual",
  },
  "gemma3:latest": {
    id: "gemma3:latest",
    name: "Gemma 3",
    provider: "ollama",
    description: "Lightweight, efficient, good general purpose",
  },
  "llama3.2:latest": {
    id: "llama3.2:latest",
    name: "Llama 3.2",
    provider: "ollama",
    description: "Meta's latest, strong all-around",
  },
  "llama3.1:latest": {
    id: "llama3.1:latest",
    name: "Llama 3.1",
    provider: "ollama",
    description: "Meta's flagship, large context",
  },
  "deepseek-r1:1.5b": {
    id: "deepseek-r1:1.5b",
    name: "DeepSeek R1 1.5B",
    provider: "ollama",
    description: "Ultra-lightweight, fast on CPU",
  },
};

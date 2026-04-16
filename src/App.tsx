import { useState, useEffect, useRef, useCallback } from "react";
import { Settings, Trash2, Bot, Sparkles } from "lucide-react";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { ModelSelector } from "./components/ModelSelector";
import { SettingsModal } from "./components/SettingsModal";
import { chatWithOllama, chatWithOpenRouter } from "./lib/api";
import {
  loadSettings,
  saveSettings,
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
} from "./lib/store";
import type { Message, Settings as SettingsType } from "./lib/types";
import "./index.css";

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-4 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
        <Bot size={32} className="text-[var(--color-primary)]" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Welcome to Tittu Agent
        </h2>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">
          Select a model and start chatting. Ollama models run locally — no API
          key needed.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
        <Sparkles size={12} />
        <span>Powered by local Ollama or OpenRouter</span>
      </div>
    </div>
  );
}

export default function App() {
  const [settings, setSettings] = useState<SettingsType>(() => loadSettings());
  const [messages, setMessages] = useState<Message[]>(() => loadChatHistory());
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (content: string) => {
      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const updatedMessages = [...messages, userMsg];
      const controller = new AbortController();
      abortRef.current = controller;

      let partialContent = "";

      try {
        if (settings.selectedModel === "gpt-oss-120b") {
          if (!settings.openRouterApiKey) {
            setMessages((prev) => [
              ...prev,
              {
                id: generateId(),
                role: "assistant",
                content:
                  "Error: OpenRouter API key required. Click model selector → API Settings.",
                timestamp: Date.now(),
              },
            ]);
            setIsLoading(false);
            return;
          }
          await chatWithOpenRouter(
            "gpt-oss-120b",
            updatedMessages,
            settings.openRouterApiKey,
            (chunk) => {
              partialContent += chunk;
              setMessages((prev) => {
                const withoutPartial = prev.filter(
                  (m) => m.id !== "__streaming__",
                );
                return [
                  ...withoutPartial,
                  {
                    id: "__streaming__",
                    role: "assistant",
                    content: partialContent,
                    timestamp: Date.now(),
                  },
                ];
              });
            },
            controller.signal,
          );
        } else {
          await chatWithOllama(
            settings.selectedModel,
            updatedMessages,
            (chunk) => {
              partialContent += chunk;
              setMessages((prev) => {
                const withoutPartial = prev.filter(
                  (m) => m.id !== "__streaming__",
                );
                return [
                  ...withoutPartial,
                  {
                    id: "__streaming__",
                    role: "assistant",
                    content: partialContent,
                    timestamp: Date.now(),
                  },
                ];
              });
            },
            controller.signal,
          );
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== "__streaming__"),
            {
              id: generateId(),
              role: "assistant",
              content: `Error: ${(err as Error).message}`,
              timestamp: Date.now(),
            },
          ]);
        }
      } finally {
        setMessages((prev) => prev.filter((m) => m.id !== "__streaming__"));
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [messages, settings],
  );

  const handleStop = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages((prev) => prev.filter((m) => m.id !== "__streaming__"));
  };

  const handleClear = () => {
    clearChatHistory();
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <h1 className="font-semibold text-gray-900">Tittu Agent</h1>
        </div>

        <div className="flex items-center gap-2">
          <ModelSelector
            selectedModel={settings.selectedModel}
            ollamaModels={settings.ollamaModels}
            onModelChange={(model) =>
              setSettings((s) => {
                const updated = { ...s, selectedModel: model };
                saveSettings(updated);
                return updated;
              })
            }
            onOpenSettings={() => setShowSettings(true)}
          />

          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Clear chat"
            >
              <Trash2 size={16} />
            </button>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeMessage />
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={false}
        isLoading={isLoading}
        onStop={handleStop}
      />

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={(s) => {
            setSettings(s);
            saveSettings(s);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

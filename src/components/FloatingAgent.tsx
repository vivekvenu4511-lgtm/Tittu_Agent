import { useState, useEffect, useCallback, useRef } from "react";
import {
  Send,
  X,
  Minimize2,
  Maximize2,
  Settings,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import { Toaster, toast } from "sonner";
import { chatWithOpenRouter } from "../lib/api";
import { generateId } from "../lib/store";
import type { Message } from "../lib/types";
import { skillRegistry, getEnabledSkills } from "../skills/registry";

interface FloatingAgentProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingAgent({ isOpen, onClose }: FloatingAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const apiKey = localStorage.getItem("openrouter_api_key");
    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: "No API key configured. Please set up in the main app.",
          timestamp: Date.now(),
        },
      ]);
      setIsLoading(false);
      return;
    }

    const enabledSkills = getEnabledSkills();
    const skillsContext = enabledSkills
      .slice(0, 10)
      .map((s) => `• ${s.name}: ${s.description}`)
      .join("\n");

    const systemMsg: Message = {
      id: "__system__",
      role: "system",
      content: `You are Tittu Agent, a helpful AI assistant. Available skills:\n${skillsContext}`,
      timestamp: Date.now(),
    };

    const allMessages = [...messages, systemMsg, userMsg];
    let partialContent = "";

    try {
      await chatWithOpenRouter(
        "deepseek-ai/DeepSeek-R1",
        allMessages,
        apiKey,
        (chunk) => {
          partialContent += chunk;
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== "__streaming__");
            return [
              ...filtered,
              {
                id: "__streaming__",
                role: "assistant",
                content: partialContent,
                timestamp: Date.now(),
              },
            ];
          });
        },
      );
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: `Error: ${(err as Error).message}`,
          timestamp: Date.now(),
        },
      ]);
    }

    setIsLoading(false);
  }, [input, messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        "fixed bottom-4 right-4 z-50 flex flex-col bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden",
        isMinimized ? "w-80 h-14" : "w-96 h-[500px]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-primary)] text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={14} />
          <span className="text-sm font-medium">Tittu Agent</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-4">
                Press Ctrl+Space to toggle • Esc to close
              </div>
            )}
            {messages
              .filter((m) => m.id !== "__streaming__" && m.id !== "__system__")
              .map((msg) => (
                <div
                  key={msg.id}
                  className={clsx(
                    "text-sm p-2 rounded-lg",
                    msg.role === "user"
                      ? "bg-[var(--color-primary)]/10 text-right"
                      : "bg-gray-100",
                  )}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))}
            {isLoading && (
              <div className="text-sm text-gray-400 animate-pulse">
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Tittu..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-1.5 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

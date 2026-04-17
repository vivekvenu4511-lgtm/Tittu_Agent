import { useState, useEffect, useRef, useCallback } from "react";
import {
  Settings,
  Trash2,
  Bot,
  Sparkles,
  Lightbulb,
  BookOpen,
  Code2,
  Search,
  FolderOpen,
  FileCode,
  CheckSquare,
  Puzzle,
  Plug,
  HelpCircle,
  Key,
  Lock,
} from "lucide-react";
import { Toaster } from "sonner";
import { clsx } from "clsx";

import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { ModelSelector } from "./components/ModelSelector";
import { SettingsModal } from "./components/SettingsModal";
import { SkillsManager } from "./components/SkillsManager";
import { GraphView } from "./components/GraphView";
import { AgentSelector } from "./components/AgentSelector";
import { FloatingAgent } from "./components/FloatingAgent";

import { chatWithOpenRouter } from "./lib/api";
import { parseToolCalls, executeTool, removeCallBlocks } from "./lib/tools";
import {
  loadSettings,
  loadSettingsSync,
  saveSettings,
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
} from "./lib/store";
import type { Message, Settings as SettingsType } from "./lib/types";

import {
  skillRegistry,
  agentRegistry,
  getEnabledSkills,
} from "./skills/registry";
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
          AI assistant with 2949 skills and 72 agents. Select a model and start
          chatting.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
        <Sparkles size={12} />
        <span>Powered by OpenRouter + Skills</span>
      </div>
    </div>
  );
}

interface FirstRunWizardProps {
  onComplete: () => void;
}

function FirstRunWizard({ onComplete }: FirstRunWizardProps) {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd)) return "Password must contain uppercase";
    if (!/[a-z]/.test(pwd)) return "Password must contain lowercase";
    if (!/[0-9]/.test(pwd)) return "Password must contain a number";
    return "";
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!apiKey.trim()) {
        setError("API key is required");
        return;
      }
      setError("");
      setIsLoading(true);
      try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!response.ok) throw new Error("Invalid API key");
        const data = await response.json();
        if (!data.data || !Array.isArray(data.data))
          throw new Error("Invalid response");
        localStorage.setItem("openrouter_api_key", apiKey);
        setStep(2);
      } catch (err) {
        setError("Invalid API key. Please check and try again.");
      } finally {
        setIsLoading(false);
      }
    } else if (step === 2) {
      const pwdError = validatePassword(password);
      if (pwdError) {
        setError(pwdError);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      setError("");
      localStorage.setItem("master_password", password);
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-[var(--color-primary)] px-6 py-4">
          <h2 className="text-xl font-semibold text-white">
            Welcome to Tittu Agent
          </h2>
          <p className="text-white/80 text-sm">Let's get you set up</p>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <Key size={16} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    OpenRouter API Key
                  </h3>
                  <p className="text-sm text-gray-500">
                    Required for cloud models
                  </p>
                </div>
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                Get a free API key from openrouter.ai
              </a>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <Lock size={16} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Master Password</h3>
                  <p className="text-sm text-gray-500">
                    For secure upgrades (min 8 chars, upper, lower, number)
                  </p>
                </div>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isLoading
                ? "Checking..."
                : step === 1
                  ? "Continue"
                  : "Get Started"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [settings, setSettings] = useState<SettingsType>(loadSettingsSync);
  const [messages, setMessages] = useState<Message[]>(() => loadChatHistory());
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [activeTab, setActiveTab] = useState("workspace");
  const [floatingOpen, setFloatingOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiKey = localStorage.getItem("openrouter_api_key");
    if (!apiKey) {
      setIsFirstRun(true);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        setFloatingOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

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

      const enabledSkills = getEnabledSkills();
      const skillsContext = enabledSkills
        .map((s) => `### Skill: ${s.name}\n${s.description}`)
        .join("\n\n");

      const skillContextMsg: Message = skillsContext
        ? {
            id: "__skills__",
            role: "system",
            content: `You have access to the following skills:\n\n${skillsContext}\n\nWhen appropriate, use <CALL>{"name": "skill_name", "args": {...}}</CALL> to invoke a skill.`,
            timestamp: Date.now(),
          }
        : { id: "", role: "system", content: "", timestamp: 0 };

      const chatMsgs = messages.filter((m) => m.id !== "__skills__");
      const msgsWithSkills = skillContextMsg.content
        ? [skillContextMsg, ...chatMsgs, userMsg]
        : chatMsgs.concat([userMsg]);

      const updatedMessages = msgsWithSkills;
      const controller = new AbortController();
      abortRef.current = controller;

      let partialContent = "";

      const apiKey =
        localStorage.getItem("openrouter_api_key") || settings.openRouterApiKey;

      if (!apiKey) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content:
              "Error: No OpenRouter API key. Please configure in Settings.",
            timestamp: Date.now(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      try {
        await chatWithOpenRouter(
          settings.selectedModel || "openai/gpt-4o-mini",
          updatedMessages,
          apiKey,
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
      }

      const finalContent = partialContent;

      const toolCalls = parseToolCalls(finalContent);
      if (toolCalls.length > 0) {
        for (const call of toolCalls) {
          try {
            const result = await executeTool(call.name, call.args);
            const resultMsg: Message = {
              id: generateId(),
              role: "assistant",
              content: `**[Tool: ${call.name}]**\n\nArgs: ${JSON.stringify(call.args, null, 2)}\n\n**Result:** ${result.success ? "✅" : "❌"} ${result.result}${result.error ? `\n\n**Error:** ${result.error}` : ""}`,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, resultMsg]);
          } catch (err) {
            const errorMsg: Message = {
              id: generateId(),
              role: "assistant",
              content: `**[Tool Error]** ${(err as Error).message}`,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errorMsg]);
          }
        }
      }

      const cleanedContent = removeCallBlocks(finalContent);
      if (cleanedContent) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "__streaming__"),
          {
            id: generateId(),
            role: "assistant",
            content: cleanedContent,
            timestamp: Date.now(),
          },
        ]);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== "__streaming__"));
      }

      setIsLoading(false);
      abortRef.current = null;
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

  const tabs = [
    {
      id: "workspace",
      label: "Workspace",
      icon: Bot,
      content: (
        <div className="flex flex-col h-full">
          <main className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <WelcomeMessage />
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </main>
          <ChatInput
            onSend={handleSend}
            disabled={false}
            isLoading={isLoading}
            onStop={handleStop}
          />
        </div>
      ),
    },
    {
      id: "projects",
      label: "Projects",
      icon: FolderOpen,
      content: (
        <div className="text-gray-500">
          Projects - Manage your projects here
        </div>
      ),
    },
    {
      id: "vibecode",
      label: "Vibe Code",
      icon: Code2,
      content: (
        <div className="text-gray-500">Vibe Code - AI coding environment</div>
      ),
    },
    {
      id: "research",
      label: "Research",
      icon: Search,
      content: (
        <div className="text-gray-500">Research - Background AI agents</div>
      ),
    },
    {
      id: "artifacts",
      label: "Artifacts",
      icon: FileCode,
      content: (
        <div className="text-gray-500">Artifacts - Generated code/apps</div>
      ),
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: CheckSquare,
      content: <div className="text-gray-500">Tasks - Task management</div>,
    },
    {
      id: "extensions",
      label: "Extensions",
      icon: Puzzle,
      content: (
        <div className="text-gray-500">Extensions - Plugin marketplace</div>
      ),
    },
    {
      id: "connectors",
      label: "Connectors",
      icon: Plug,
      content: (
        <div className="text-gray-500">
          Connectors - Third-party integrations
        </div>
      ),
    },
    {
      id: "skills",
      label: "Skills",
      icon: Lightbulb,
      content: <SkillsManager skills={skillRegistry} />,
    },
    {
      id: "knowledge",
      label: "Knowledge",
      icon: BookOpen,
      content: <GraphView />,
    },
    {
      id: "guide",
      label: "Guide",
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tittu Agent Guide</h2>
          <div className="prose prose-sm max-w-none">
            <p>Welcome to Tittu Agent! Here's how to get started:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Enter your OpenRouter API key in the first-run wizard</li>
              <li>Select a model from the dropdown in the header</li>
              <li>Enable skills in the Skills tab</li>
              <li>Start chatting with the AI</li>
            </ol>
            <h3 className="font-medium mt-4">Available Skills</h3>
            <p>
              {skillRegistry.length} skills loaded from Antigravity Awesome
              Skills
            </p>
            <h3 className="font-medium mt-4">Available Agents</h3>
            <p>{agentRegistry.length} agents loaded</p>
          </div>
        </div>
      ),
    },
    {
      id: "config",
      label: "Config",
      icon: Settings,
      content: (
        <SettingsModal
          settings={settings}
          onSave={(s) => {
            setSettings(s);
            saveSettings(s);
          }}
          onClose={() => {}}
        />
      ),
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab);

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)]">
      <Toaster position="top-right" />

      {isFirstRun && <FirstRunWizard onComplete={() => setIsFirstRun(false)} />}
      <FloatingAgent
        isOpen={floatingOpen}
        onClose={() => setFloatingOpen(false)}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <h1 className="font-semibold text-gray-900">Tittu Agent</h1>
        </div>

        <div className="flex items-center gap-2">
          <AgentSelector
            agents={agentRegistry}
            selectedAgentId={localStorage.getItem("selectedAgent") ?? undefined}
          />

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

      {/* Tab Navigation */}
      <div className="border-b border-gray-100 bg-white">
        <div className="flex gap-1 px-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === tab.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
              )}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">{currentTab?.content}</main>

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

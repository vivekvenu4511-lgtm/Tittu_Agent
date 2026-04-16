import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";
import type { Settings } from "../lib/types";

interface SettingsModalProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  onSave,
  onClose,
}: SettingsModalProps) {
  const [form, setForm] = useState<Settings>({ ...settings });
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Provider
            </label>
            <select
              value={form.selectedProvider}
              onChange={(e) =>
                setForm((f) => ({ ...f, selectedProvider: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] bg-white"
            >
              <option value="ollama">Ollama (Local — no API key)</option>
              <option value="openrouter">
                OpenRouter (Remote — API key required)
              </option>
              <option value="openai">OpenAI (Remote — API key required)</option>
            </select>
          </div>

          {/* OpenRouter API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              OpenRouter API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={form.openRouterApiKey}
                onChange={(e) =>
                  setForm((f) => ({ ...f, openRouterApiKey: e.target.value }))
                }
                placeholder="sk-or-..."
                className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Required for OpenRouter models. Get one at openrouter.ai
            </p>
          </div>

          {/* OpenAI API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={form.openaiApiKey}
                onChange={(e) =>
                  setForm((f) => ({ ...f, openaiApiKey: e.target.value }))
                }
                placeholder="sk-..."
                className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Optional. Required for OpenAI models.
            </p>
          </div>

          {/* Ollama Models */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Available Ollama Models
            </label>
            <textarea
              value={form.ollamaModels.join("\n")}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  ollamaModels: e.target.value.split("\n").filter(Boolean),
                }))
              }
              rows={4}
              placeholder={"deepseek-r1:8b\nqwen2.5:latest"}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              One model name per line. Pull models with:{" "}
              <code className="bg-gray-100 px-1 rounded">
                ollama pull modelname
              </code>
            </p>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Temperature: {form.temperature.toFixed(1)}
            </label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={form.temperature}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  temperature: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-[var(--color-primary)]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Max Response Tokens: {form.maxTokens}
            </label>
            <input
              type="range"
              min={256}
              max={8192}
              step={256}
              value={form.maxTokens}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxTokens: parseInt(e.target.value) }))
              }
              className="w-full accent-[var(--color-primary)]"
            />
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "golden", label: "Golden", color: "#b45309" },
                { id: "sage", label: "Sage", color: "#4d7c0f" },
                { id: "pastel", label: "Pastel", color: "#be185d" },
                { id: "ocean", label: "Ocean", color: "#1d4ed8" },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setForm((f) => ({ ...f, theme: theme.id }))}
                  className={clsx(
                    "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors",
                    form.theme === theme.id
                      ? "border-[var(--color-primary)] bg-[var(--color-bg)]"
                      : "border-gray-100 hover:border-gray-200",
                  )}
                >
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-xs text-gray-600">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(form);
              onClose();
            }}
            className={clsx(
              "px-4 py-2 text-sm rounded-lg text-white font-medium transition-colors",
              "bg-[var(--color-primary)] hover:opacity-90",
            )}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

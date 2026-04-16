import { useState, useEffect } from "react";
import { ChevronDown, Bot } from "lucide-react";
import { clsx } from "clsx";
import { checkOllamaStatus } from "../lib/api";
import { MODEL_MAP, DEFAULT_OLLAMA_MODELS } from "../lib/types";

interface ModelSelectorProps {
  selectedModel: string;
  ollamaModels: string[];
  onModelChange: (model: string) => void;
  onOpenSettings: () => void;
}

export function ModelSelector({
  selectedModel,
  ollamaModels,
  onModelChange,
  onOpenSettings,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkOllamaStatus()
      .then(setOllamaOnline)
      .catch(() => setOllamaOnline(false));
  }, []);

  const allModels = [...ollamaModels, ...DEFAULT_OLLAMA_MODELS].filter(
    (m, i, arr) => arr.indexOf(m) === i,
  );

  const selected = MODEL_MAP[selectedModel] ?? {
    id: selectedModel,
    name: selectedModel,
    provider: "ollama" as const,
    description: "Custom model",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
          "border border-[var(--color-primary)]/30 bg-white hover:bg-[var(--color-bg)] transition-colors",
        )}
      >
        <Bot size={14} className="text-[var(--color-primary)]" />
        <span>{selected.name}</span>
        <ChevronDown
          size={14}
          className={clsx("transition-transform", open && "rotate-180")}
        />
        <span
          className={clsx(
            "w-2 h-2 rounded-full",
            ollamaOnline === true && "bg-green-500",
            ollamaOnline === false && "bg-red-500",
            ollamaOnline === null && "bg-gray-400",
          )}
          title={
            ollamaOnline === true
              ? "Ollama connected"
              : ollamaOnline === false
                ? "Ollama offline — start it with: ollama serve"
                : "Checking Ollama..."
          }
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 text-xs text-gray-500 border-b border-gray-100">
            Select a model
          </div>
          {allModels.map((modelId) => {
            const model = MODEL_MAP[modelId];
            return (
              <button
                key={modelId}
                onClick={() => {
                  onModelChange(modelId);
                  setOpen(false);
                }}
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                  selectedModel === modelId &&
                    "bg-[var(--color-bg)] font-medium",
                )}
              >
                <div className="font-medium text-gray-900">
                  {model?.name ?? modelId}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {model?.description ?? modelId}
                </div>
              </button>
            );
          })}
          <div className="border-t border-gray-100 p-2">
            <button
              onClick={() => {
                setOpen(false);
                onOpenSettings();
              }}
              className="w-full text-left px-3 py-2 text-sm text-[var(--color-primary)] hover:bg-gray-50 rounded-lg transition-colors"
            >
              API Settings &amp; Model Config
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}

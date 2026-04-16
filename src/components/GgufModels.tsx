import { useState, useEffect } from "react";
import { Download, Cpu, HardDrive } from "lucide-react";
import { clsx } from "clsx";
import {
  listLocalModels,
  downloadModel,
  getSystemInfo,
  type LocalModelInfo,
  type SystemInfo,
} from "../lib/api";

interface GgufModelsProps {
  onSelectModel?: (filename: string) => void;
  selectedModel?: string;
}

const SUGGESTED_MODELS = [
  {
    repoId: "QuantFactory/Meta-Llama-3-8B-Instruct-GGUF",
    filename: "Meta-Llama-3-8B-Instruct-Q4_K_M.gguf",
    size: "~5GB",
    description: "Llama 3 8B — strong general purpose",
  },
  {
    repoId: "Qwen/Qwen2.5-7B-Instruct-GGUF",
    filename: "qwen2.5-7b-instruct-q4_k_m.gguf",
    size: "~4.5GB",
    description: "Qwen 2.5 7B — multilingual, fast",
  },
  {
    repoId: "lmstudio-community/DeepSeek-R1-Distill-Q4_K_M-GGUF",
    filename: "DeepSeek-R1-Distill-Q4_K_M.gguf",
    size: "~4.5GB",
    description: "DeepSeek R1 7B — strong reasoning",
  },
  {
    repoId: "bartowski/gemma-2-9b-it-GGUF",
    filename: "gemma-2-9b-it-Q4_K_M.gguf",
    size: "~5.5GB",
    description: "Gemma 2 9B — efficient, good quality",
  },
];

export function GgufModels({ onSelectModel, selectedModel }: GgufModelsProps) {
  const [models, setModels] = useState<LocalModelInfo[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    listLocalModels()
      .then(setModels)
      .catch(() => setModels([]));
    getSystemInfo()
      .then(setSystemInfo)
      .catch(() => {});
  }, []);

  const handleDownload = async (repoId: string, filename: string) => {
    setDownloading(filename);
    setDownloadError(null);
    try {
      await downloadModel(repoId, filename);
      await listLocalModels().then(setModels);
      setDownloading(null);
    } catch (err) {
      setDownloadError((err as Error).message);
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* System Info */}
      {systemInfo && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            System
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Cpu size={14} className="text-gray-400" />
            <span>{systemInfo.cpu_cores} CPU cores</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <HardDrive size={14} className="text-gray-400" />
            <span>{(systemInfo.total_memory_mb / 1024).toFixed(1)} GB RAM</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={clsx(
                "w-2 h-2 rounded-full",
                systemInfo.gpu.is_available ? "bg-green-500" : "bg-gray-400",
              )}
            />
            <span className="text-gray-700">
              {systemInfo.gpu.name} ({systemInfo.gpu.backend.toUpperCase()})
            </span>
          </div>
        </div>
      )}

      {/* Local Models */}
      <div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Local Models ({models.length})
        </div>
        {models.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No local GGUF models yet. Download one below.
          </p>
        ) : (
          <div className="space-y-1">
            {models.map((m) => (
              <button
                key={m.path}
                onClick={() => onSelectModel?.(m.name + ".gguf")}
                className={clsx(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  selectedModel === m.name + ".gguf"
                    ? "bg-[var(--color-bg)] font-medium border border-[var(--color-primary)]/30"
                    : "hover:bg-gray-50",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">{m.name}</span>
                  <span className="text-xs text-gray-400">{m.size_mb} MB</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Download Models */}
      <div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Download Model
        </div>
        <div className="space-y-2">
          {SUGGESTED_MODELS.map((m) => (
            <div
              key={m.filename}
              className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {m.description}
                </div>
                <div className="text-xs text-gray-400">{m.size}</div>
              </div>
              <button
                onClick={() => handleDownload(m.repoId, m.filename)}
                disabled={downloading === m.filename}
                className={clsx(
                  "ml-2 p-1.5 rounded-lg transition-colors flex-shrink-0",
                  downloading === m.filename
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[var(--color-primary)] text-white hover:opacity-80",
                )}
                title={`Download from HuggingFace: ${m.repoId}`}
              >
                <Download size={14} />
              </button>
            </div>
          ))}
        </div>
        {downloadError && (
          <p className="text-xs text-red-500 mt-2">{downloadError}</p>
        )}
      </div>
    </div>
  );
}

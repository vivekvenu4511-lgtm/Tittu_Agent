import { useState, useEffect } from "react";
import {
  Cpu,
  Download,
  Trash2,
  Zap,
  AlertCircle,
  Check,
  RefreshCw,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { listLocalModels, downloadModel, getSystemInfo } from "../lib/api";
import type { LocalModelInfo, SystemInfo } from "../lib/api";

interface GgufModelsProps {
  onSelectModel?: (filename: string) => void;
  selectedModel?: string;
}

const SUGGESTED_MODELS = [
  {
    repoId: "QuantFactory/Meta-Llama-3-8B-Instruct-GGUF",
    filename: "Meta-Llama-3-8B-Instruct-Q4_K_M.gguf",
    name: "Llama 3.1 8B",
    size: "4.7GB",
  },
  {
    repoId: "deepseek-ai/DeepSeek-R1-GGUF",
    filename: "DeepSeek-R1-8B-Q4_K_M.gguf",
    name: "DeepSeek R1 8B",
    size: "4.9GB",
  },
  {
    repoId: "Qwen/Qwen2.5-3B-Instruct-GGUF",
    filename: "Qwen2.5-3B-Instruct-Q4_K_M.gguf",
    name: "Qwen 2.5 3B",
    size: "2.5GB",
  },
];

export function GgufModels({ onSelectModel, selectedModel }: GgufModelsProps) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [localModels, setLocalModels] = useState<LocalModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const info = await getSystemInfo();
      const models = await listLocalModels();
      setSystemInfo(info);
      setLocalModels(models);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (model: (typeof SUGGESTED_MODELS)[0]) => {
    setIsDownloading(true);
    try {
      await downloadModel(model.repoId, model.filename);
      toast.success(`Downloaded ${model.name}`);
      loadData();
    } catch (err) {
      toast.error(`Download failed: ${err}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async (modelId: string) => {
    try {
      await invoke("delete_gguf_model", { modelId });
      toast.success("Model deleted");
      loadData();
    } catch (err) {
      toast.error(`Delete failed: ${err}`);
    }
  };

  const gpuInfo = systemInfo?.gpu;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GPU Status Card */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              gpuInfo?.is_available ? "bg-green-100" : "bg-gray-200"
            }`}
          >
            <Cpu
              size={20}
              className={
                gpuInfo?.is_available ? "text-green-600" : "text-gray-400"
              }
            />
          </div>
          <div className="flex-1">
            <div className="font-medium">
              {gpuInfo?.is_available
                ? `${gpuInfo.vendor} ${gpuInfo.name}`
                : "No GPU Detected"}
            </div>
            <div className="text-sm text-gray-500">
              {gpuInfo?.is_available
                ? `${Math.round((gpuInfo.memory_mb || 0) / 1024)}GB VRAM • ${gpuInfo.backend} acceleration`
                : "Using CPU only (slower performance)"}
            </div>
          </div>
          <button
            onClick={loadData}
            className="p-2 hover:bg-gray-200 rounded-lg"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {gpuInfo?.is_available ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
            <Zap size={14} />
            <span>GPU acceleration enabled - optimal performance</span>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle size={14} />
            <span>Running in CPU-only mode. Performance will be limited.</span>
          </div>
        )}
      </div>

      {/* Download Models */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Download Local GGUF Models
        </h3>
        <div className="space-y-2">
          {SUGGESTED_MODELS.map((model) => (
            <div
              key={model.filename}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-[var(--color-primary)]"
            >
              <div className="flex items-center gap-3">
                <HardDrive size={16} className="text-gray-400" />
                <div>
                  <div className="font-medium text-sm">{model.name}</div>
                  <div className="text-xs text-gray-500">{model.size}</div>
                </div>
              </div>
              <button
                onClick={() => handleDownload(model)}
                disabled={isDownloading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                <Download size={12} />
                {isDownloading ? "Loading..." : "Download"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Local Models */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Local Models ({localModels.length})
        </h3>
        <div className="space-y-2">
          {localModels.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
              No local models. Download one to get started.
            </div>
          ) : (
            localModels.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <button
                  onClick={() => onSelectModel?.(model.filename)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <HardDrive
                    size={16}
                    className={
                      selectedModel === model.filename
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-primary)]"
                    }
                  />
                  <div>
                    <div className="font-medium text-sm">{model.name}</div>
                    <div className="text-xs text-gray-500">
                      {(model.size_mb / 1024).toFixed(1)} GB
                      {selectedModel === model.filename && (
                        <span className="ml-2 text-[var(--color-primary)]">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(model.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

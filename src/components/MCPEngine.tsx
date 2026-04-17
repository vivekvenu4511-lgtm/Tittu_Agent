import { useState, useEffect } from "react";
import {
  Zap,
  ArrowRightLeft,
  Cpu,
  Globe,
  Clock,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

type ProviderType = "local" | "openrouter" | "hybrid";

interface McpConfig {
  primary: ProviderType;
  fallback: ProviderType;
  autoFallback: boolean;
  timeout: number;
}

export function MCPEngine() {
  const [config, setConfig] = useState<McpConfig>({
    primary: "local",
    fallback: "openrouter",
    autoFallback: true,
    timeout: 30,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, _setStatus] = useState<{
    local: boolean;
    openrouter: boolean;
  }>({
    local: false,
    openrouter: false,
  });

  useEffect(() => {
    loadConfig();
    checkProviders();
  }, []);

  const loadConfig = () => {
    const stored = localStorage.getItem("mcp_config");
    if (stored) {
      try {
        setConfig(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  };

  const checkProviders = async () => {
    // Check if local GGUF models are available
    const localModels = localStorage.getItem("local_models");
    const hasLocal = localModels && JSON.parse(localModels).length > 0;

    // Check if OpenRouter key is set
    const apiKey = localStorage.getItem("openrouter_api_key");
    const hasOpenRouter = apiKey !== null;

    _setStatus({
      local: !!hasLocal,
      openrouter: !!hasOpenRouter,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("mcp_config", JSON.stringify(config));
      toast.success("MCP configuration saved");
    } catch (err) {
      toast.error(`Failed to save: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const providerOptions: {
    value: ProviderType;
    label: string;
    description: string;
    icon: React.ElementType;
  }[] = [
    {
      value: "local",
      label: "Local GGUF",
      description: "Use local models ( Ollama / llama.cpp ) - offline, private",
      icon: Cpu,
    },
    {
      value: "openrouter",
      label: "OpenRouter Cloud",
      description: "Use cloud models via OpenRouter API - requires internet",
      icon: Globe,
    },
    {
      value: "hybrid",
      label: "Hybrid (Auto)",
      description: "Use local, fall back to cloud if needed - best of both",
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-lg border ${status.local ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
        >
          <div className="flex items-center gap-2">
            <Cpu
              size={20}
              className={status.local ? "text-green-600" : "text-gray-400"}
            />
            <span className="font-medium">Local GGUF</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {status.local ? "Available" : "No models installed"}
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${status.openrouter ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
        >
          <div className="flex items-center gap-2">
            <Globe
              size={20}
              className={status.openrouter ? "text-green-600" : "text-gray-400"}
            />
            <span className="font-medium">OpenRouter</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {status.openrouter ? "Connected" : "API key not set"}
          </div>
        </div>
      </div>

      {/* Primary Provider */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Primary Provider
        </h3>
        <div className="space-y-2">
          {providerOptions.map((provider) => (
            <button
              key={provider.value}
              onClick={() =>
                setConfig((prev) => ({ ...prev, primary: provider.value }))
              }
              className={`w-full flex items-center gap-3 p-4 border rounded-lg text-left transition-colors ${
                config.primary === provider.value
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <provider.icon
                size={20}
                className={
                  config.primary === provider.value
                    ? "text-[var(--color-primary)]"
                    : "text-gray-400"
                }
              />
              <div className="flex-1">
                <div className="font-medium">{provider.label}</div>
                <div className="text-xs text-gray-500">
                  {provider.description}
                </div>
              </div>
              {config.primary === provider.value && (
                <CheckCircle
                  size={20}
                  className="text-[var(--color-primary)]"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fallback Provider */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Fallback Provider
        </h3>
        <div className="space-y-2">
          {providerOptions
            .filter((p) => p.value !== config.primary)
            .map((provider) => (
              <button
                key={provider.value}
                onClick={() =>
                  setConfig((prev) => ({ ...prev, fallback: provider.value }))
                }
                className={`w-full flex items-center gap-3 p-4 border rounded-lg text-left transition-colors ${
                  config.fallback === provider.value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <ArrowRightLeft size={16} className="text-gray-400" />
                <div className="flex-1">
                  <div className="font-medium">{provider.label}</div>
                  <div className="text-xs text-gray-500">
                    Used when primary fails
                  </div>
                </div>
                {config.fallback === provider.value && (
                  <CheckCircle
                    size={20}
                    className="text-[var(--color-primary)]"
                  />
                )}
              </button>
            ))}
        </div>
      </div>

      {/* Auto-Fallback Toggle */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-amber-500" />
            <div>
              <div className="font-medium">Auto-Fallback</div>
              <div className="text-sm text-gray-500">
                Automatically switch to fallback if primary fails or times out
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoFallback}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  autoFallback: e.target.checked,
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
          </label>
        </div>
      </div>

      {/* Timeout Setting */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          <Clock size={14} className="inline mr-1" />
          Timeout (seconds)
        </h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={10}
            max={120}
            step={10}
            value={config.timeout}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                timeout: parseInt(e.target.value),
              }))
            }
            className="flex-1"
          />
          <span className="text-sm font-medium w-16">{config.timeout}s</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          How long to wait before switching to fallback provider
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-3 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save MCP Configuration"}
      </button>
    </div>
  );
}

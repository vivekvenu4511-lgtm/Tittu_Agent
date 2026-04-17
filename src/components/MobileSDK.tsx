import { useState } from "react";
import {
  Smartphone,
  Globe,
  Cloud,
  Key,
  Download,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface MobileConfig {
  driveSync: boolean;
  apiEndpoint: string;
  autoSync: boolean;
}

export function MobileSDK() {
  const [config, setConfig] = useState<MobileConfig>({
    driveSync: true,
    apiEndpoint: "",
    autoSync: true,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectDrive = async () => {
    setIsConnecting(true);
    try {
      // Simulate OAuth flow
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Google Drive connected for mobile sync");
    } catch (err) {
      toast.error("Failed to connect: " + err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDownloadSDK = () => {
    const sdkInfo = {
      name: "tittu-mobile-sdk",
      version: "0.1.0",
      description: "React Native SDK for Tittu Agent",
      repository: "https://github.com/vivekvenu4511-lgtm/Tittu_Agent",
      installCommand: "npx @tittu/mobile-sdk init",
    };

    const blob = new Blob([JSON.stringify(sdkInfo, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tittu-mobile-sdk.json";
    a.click();
    URL.revokeObjectURL(url);

    toast.success("SDK info downloaded");
  };

  return (
    <div className="space-y-6">
      {/* Mobile App Preview */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-48 h-96 bg-gray-900 rounded-3xl border-4 border-gray-700 overflow-hidden">
            <div className="h-12 bg-gray-800 flex items-center justify-center">
              <div className="w-16 h-6 bg-gray-700 rounded-full" />
            </div>
            <div className="p-4 space-y-3">
              <div className="h-8 bg-[var(--color-primary)]/20 rounded-lg animate-pulse" />
              <div className="h-8 bg-gray-700 rounded-lg" />
              <div className="h-8 bg-gray-700 rounded-lg" />
            </div>
          </div>
          <Smartphone
            size={32}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-gray-400"
          />
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <Globe size={20} className="text-[var(--color-primary)] mb-2" />
          <div className="font-medium text-sm">Cross-Device Sync</div>
          <div className="text-xs text-gray-500">
            Same knowledge base on mobile
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <Cloud size={20} className="text-[var(--color-primary)] mb-2" />
          <div className="font-medium text-sm">Cloud Backup</div>
          <div className="text-xs text-gray-500">
            Automatic Google Drive sync
          </div>
        </div>
      </div>

      {/* Google Drive Connection */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud
              size={20}
              className={config.driveSync ? "text-green-600" : "text-gray-400"}
            />
            <div>
              <div className="font-medium">Google Drive Sync</div>
              <div className="text-sm text-gray-500">
                Sync knowledge base with mobile app
              </div>
            </div>
          </div>
          <button
            onClick={handleConnectDrive}
            disabled={isConnecting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
        </div>
      </div>

      {/* Auto Sync Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="font-medium">Auto-Sync</div>
          <div className="text-sm text-gray-500">
            Automatically sync when changes are made
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.autoSync}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, autoSync: e.target.checked }))
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
        </label>
      </div>

      {/* API Endpoint */}
      <div>
        <label className="text-sm font-medium text-gray-500 mb-2">
          Mobile API Endpoint
        </label>
        <input
          type="text"
          value={config.apiEndpoint}
          onChange={(e) =>
            setConfig((prev) => ({ ...prev, apiEndpoint: e.target.value }))
          }
          placeholder="https://api.tittu-agent.com"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg"
        />
        <p className="text-xs text-gray-500 mt-1">
          Custom endpoint for mobile device to connect
        </p>
      </div>

      {/* SDK Download */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Mobile SDK</div>
            <div className="text-sm text-gray-500">
              React Native + Expo integration
            </div>
          </div>
          <button
            onClick={handleDownloadSDK}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
          >
            <Download size={14} />
            Get SDK
          </button>
        </div>
      </div>

      {/* Documentation Link */}
      <a
        href="https://github.com/vivekvenu4511-lgtm/Tittu_Agent#mobile-sdk"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 p-4 text-sm text-gray-500 hover:text-gray-700"
      >
        <ExternalLink size={14} />
        View Mobile SDK Documentation
      </a>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import {
  Upload,
  Download,
  File,
  Search,
  Trash2,
  RefreshCw,
  Cloud,
  CloudOff,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: number;
  embedding?: number[];
}

interface GoogleDriveSyncProps {
  knowledgeItems: KnowledgeItem[];
  onSync: (items: KnowledgeItem[]) => void;
}

export function GoogleDriveSync({
  knowledgeItems,
  onSync,
}: GoogleDriveSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const lastSyncTime = localStorage.getItem("gdrive_last_sync");
    if (lastSyncTime) {
      setLastSync(new Date(parseInt(lastSyncTime)));
    }
    const token = localStorage.getItem("gdrive_token");
    setIsConnected(!!token);
  }, []);

  const handleConnect = async () => {
    // In a real implementation, this would use the Google Drive API
    // For now, we'll simulate the auth flow
    const mockToken = "mock_token_" + Date.now();
    localStorage.setItem("gdrive_token", mockToken);
    setIsConnected(true);
    toast.success("Connected to Google Drive");
  };

  const handleDisconnect = () => {
    localStorage.removeItem("gdrive_token");
    setIsConnected(false);
    toast.success("Disconnected from Google Drive");
  };

  const handleSync = async () => {
    if (!isConnected) {
      setError("Not connected to Google Drive");
      return;
    }

    setIsSyncing(true);
    setError("");

    try {
      // In a real implementation, this would upload to Google Drive
      // For now, we'll simulate the sync
      const syncData = {
        items: knowledgeItems,
        timestamp: Date.now(),
      };

      // Store locally as backup
      localStorage.setItem("knowledge_backup", JSON.stringify(syncData));

      const now = new Date();
      setLastSync(now);
      localStorage.setItem("gdrive_last_sync", now.getTime().toString());

      toast.success(`Synced ${knowledgeItems.length} items to Google Drive`);
    } catch (err) {
      setError("Sync failed: " + (err as Error).message);
      toast.error("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (!isConnected) {
      setError("Not connected to Google Drive");
      return;
    }

    setIsSyncing(true);
    setError("");

    try {
      const backup = localStorage.getItem("knowledge_backup");
      if (backup) {
        const data = JSON.parse(backup);
        onSync(data.items || []);
        toast.success(`Restored ${data.items?.length || 0} items from backup`);
      } else {
        toast.info("No backup found");
      }
    } catch (err) {
      setError("Restore failed: " + (err as Error).message);
      toast.error("Restore failed");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Cloud size={20} className="text-green-500" />
          ) : (
            <CloudOff size={20} className="text-gray-400" />
          )}
          <span className="font-medium">Google Drive Sync</span>
        </div>

        {isConnected ? (
          <button
            onClick={handleDisconnect}
            className="text-sm text-red-600 hover:underline"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnect}
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            Connect
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {isConnected && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            {lastSync ? (
              <span>Last synced: {lastSync.toLocaleString()}</span>
            ) : (
              <span>Never synced</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={isSyncing ? "animate-spin" : ""}
              />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>

            <button
              onClick={handleRestore}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Download size={14} />
              Restore
            </button>
          </div>

          <div className="text-xs text-gray-500">
            {knowledgeItems.length} items will be synced
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="text-sm text-gray-500">
          Connect to Google Drive to sync your knowledge base across devices.
        </div>
      )}
    </div>
  );
}

export function KnowledgeBase() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("knowledge_items");
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  const saveItems = useCallback((newItems: KnowledgeItem[]) => {
    setItems(newItems);
    localStorage.setItem("knowledge_items", JSON.stringify(newItems));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const newItems: KnowledgeItem[] = files.map((file) => ({
        id: "kb_" + Date.now() + "_" + Math.random().toString(36).slice(2),
        title: file.name,
        content: file.name,
        type: file.type || "unknown",
        createdAt: Date.now(),
      }));

      saveItems([...items, ...newItems]);
      toast.success(`Added ${newItems.length} files`);
    },
    [items, saveItems],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const newItems = items.filter((item) => item.id !== id);
      saveItems(newItems);
      toast.success("Item deleted");
    },
    [items, saveItems],
  );

  const filteredItems = searchQuery
    ? items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : items;

  const handleSync = useCallback(
    (newItems: KnowledgeItem[]) => {
      saveItems(newItems);
    },
    [saveItems],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
            : "border-gray-200"
        }`}
      >
        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">
          Drag and drop files here, or click to upload
        </p>
      </div>

      <div className="space-y-2">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
          >
            <div className="flex items-center gap-3">
              <File size={16} className="text-gray-400" />
              <div>
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-1 text-gray-400 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No knowledge items yet
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <GoogleDriveSync knowledgeItems={items} onSync={handleSync} />
      </div>
    </div>
  );
}

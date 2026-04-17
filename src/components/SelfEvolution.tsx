import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Upload,
  RefreshCw,
  Shield,
  AlertCircle,
  Check,
  Lock,
  Key,
  Cloud,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

interface ReleaseInfo {
  version: string;
  notes: string;
  published_at: string;
  assets: { name: string; browser_download_url: string }[];
}

interface BackupInfo {
  id: string;
  timestamp: number;
  size_mb: number;
  path: string;
}

export function SelfEvolution() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    checkPassword();
    loadBackups();
    checkForUpdates();
  }, []);

  const checkPassword = async () => {
    const hasPwd = localStorage.getItem("master_password") !== null;
    setHasPassword(hasPwd);
  };

  const checkForUpdates = async () => {
    setIsChecking(true);
    try {
      const info = await invoke<ReleaseInfo | null>("check_update");
      setRelease(info);
    } catch {
      // No updates available
    } finally {
      setIsChecking(false);
    }
  };

  const loadBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const list = await invoke<BackupInfo[]>("list_backups");
      setBackups(list);
    } catch {
      // No backups
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleSetPassword = useCallback(async () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error("Password must contain uppercase");
      return;
    }
    if (!/[a-z]/.test(password)) {
      toast.error("Password must contain lowercase");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("Password must contain a number");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    localStorage.setItem("master_password", password);
    setHasPassword(true);
    setPasswordModal(false);
    setPassword("");
    setConfirmPassword("");
    toast.success("Password set successfully");
  }, [password, confirmPassword]);

  const handleUpgrade = useCallback(async () => {
    if (!release) return;

    setIsUpgrading(true);
    try {
      await invoke("upgrade_app", { version: release.version });
      toast.success("Upgrade started. The app will restart automatically.");
    } catch (err) {
      toast.error(`Upgrade failed: ${err}`);
    } finally {
      setIsUpgrading(false);
    }
  }, [release]);

  const handleCreateBackup = useCallback(async () => {
    try {
      await invoke("create_backup");
      toast.success("Backup created");
      loadBackups();
    } catch (err) {
      toast.error(`Backup failed: ${err}`);
    }
  }, []);

  const handleRestoreBackup = useCallback(async (backupId: string) => {
    try {
      await invoke("restore_backup", { backupId });
      toast.success("Backup restored. The app will restart.");
    } catch (err) {
      toast.error(`Restore failed: ${err}`);
    }
  }, []);

  const handleUploadToDrive = useCallback(async () => {
    try {
      await invoke("upload_backup_to_drive");
      toast.success("Backup uploaded to Google Drive");
    } catch (err) {
      toast.error(`Upload failed: ${err}`);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Password Section */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              hasPassword ? "bg-green-100" : "bg-amber-100"
            }`}
          >
            <Shield
              size={20}
              className={hasPassword ? "text-green-600" : "text-amber-600"}
            />
          </div>
          <div className="flex-1">
            <div className="font-medium">Master Password</div>
            <div className="text-sm text-gray-500">
              {hasPassword
                ? "Protected - Required for upgrades and backups"
                : "Not set - Required for secure upgrades"}
            </div>
          </div>
          {!hasPassword && (
            <button
              onClick={() => setPasswordModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
            >
              <Key size={12} />
              Set Password
            </button>
          )}
        </div>
      </div>

      {/* Update Section */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
              <RefreshCw
                size={20}
                className={
                  isChecking ? "text-blue-600 animate-spin" : "text-blue-600"
                }
              />
            </div>
            <div>
              <div className="font-medium">Self-Upgrade</div>
              <div className="text-sm text-gray-500">
                {release
                  ? `Version ${release.version} available`
                  : "Checking for updates..."}
              </div>
            </div>
          </div>
          <button
            onClick={checkForUpdates}
            disabled={isChecking || isUpgrading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={12} className={isChecking ? "animate-spin" : ""} />
            Check
          </button>
        </div>

        {release && (
          <div className="mt-3">
            <div className="text-sm text-gray-600 mb-2">{release.notes}</div>
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              <Download size={12} />
              {isUpgrading ? "Upgrading..." : "Download & Install"}
            </button>
          </div>
        )}
      </div>

      {/* Backups Section */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
              <HardDrive size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="font-medium">Backups</div>
              <div className="text-sm text-gray-500">
                {backups.length} backup{backups.length !== 1 ? "s" : ""}{" "}
                available
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateBackup}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Upload size={12} />
              Create Backup
            </button>
            <button
              onClick={handleUploadToDrive}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Cloud size={12} />
              Upload to Drive
            </button>
          </div>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            No backups yet. Create one to protect your data.
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg"
              >
                <div>
                  <div className="text-sm font-medium">
                    {new Date(backup.timestamp).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(backup.size_mb / 1024).toFixed(1)} MB
                  </div>
                </div>
                <button
                  onClick={() => handleRestoreBackup(backup.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--color-primary)] border border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)]/10"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Set Master Password</h3>
            <p className="text-sm text-gray-500 mb-4">
              Requires 8+ characters with uppercase, lowercase, and number.
            </p>
            <div className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setPasswordModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSetPassword}
                className="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
              >
                Set Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

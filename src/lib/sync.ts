import { invoke } from "@tauri-apps/api/core";

export interface DriveConfig {
  enabled: boolean;
  last_sync: string | null;
  sync_folders: string[];
  auto_sync: boolean;
}

export interface SyncResult {
  success: boolean;
  files_synced: number;
  error: string | null;
}

export interface SyncStatus {
  connected: boolean;
  last_sync: string | null;
  auto_sync: boolean;
  pending: number;
}

export async function getDriveConfig(): Promise<DriveConfig> {
  return invoke<DriveConfig>("get_drive_config");
}

export async function saveDriveConfig(config: DriveConfig): Promise<void> {
  return invoke("save_drive_config", { config });
}

export async function getSyncStatus(): Promise<SyncStatus> {
  return invoke<SyncStatus>("get_sync_status");
}

export async function syncToDrive(): Promise<SyncResult> {
  return invoke<SyncResult>("sync_to_drive");
}

export async function syncFromDrive(): Promise<SyncResult> {
  return invoke<SyncResult>("sync_from_drive");
}

export async function enableDriveSync(enabled: boolean): Promise<void> {
  return invoke("enable_drive_sync", { enabled });
}

export async function setAutoSync(autoSync: boolean): Promise<void> {
  return invoke("set_auto_sync", { autoSync });
}

export function formatLastSync(lastSync: string | null): string {
  if (!lastSync) return "Never";
  const date = new Date(lastSync);
  return date.toLocaleString();
}

export function getSyncStatusIcon(status: SyncStatus): string {
  if (status.auto_sync) return "🔄";
  if (status.connected) return "✅";
  return "❌";
}

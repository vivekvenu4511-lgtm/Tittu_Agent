import { invoke } from "@tauri-apps/api/core";

export interface MobileDevice {
  id: string;
  name: string;
  platform: string;
  last_seen: string;
  is_online: boolean;
}

export interface SyncStatus {
  last_sync: string | null;
  pending_changes: number;
  syncing: boolean;
  error: string | null;
}

export interface MobileResult {
  success: boolean;
  message: string;
}

export async function getSyncStatus(): Promise<SyncStatus> {
  return invoke<SyncStatus>("get_sync_status");
}

export async function triggerSync(): Promise<SyncStatus> {
  return invoke<SyncStatus>("trigger_sync");
}

export async function listConnectedDevices(): Promise<MobileDevice[]> {
  return invoke<MobileDevice[]>("list_connected_devices");
}

export async function getMobileLinkCode(): Promise<string> {
  return invoke<string>("get_mobile_link_code");
}

export async function registerMobileDevice(
  code: string,
  deviceName: string,
  platform: string,
): Promise<MobileResult> {
  return invoke<MobileResult>("register_mobile_device", {
    code,
    deviceName,
    platform,
  });
}

export async function disconnectMobileDevice(
  deviceId: string,
): Promise<MobileResult> {
  return invoke<MobileResult>("disconnect_mobile_device", { deviceId });
}

export async function getBrainLibVersion(): Promise<string> {
  return invoke<string>("get_brain_lib_version");
}

export function formatLastSync(lastSync: string | null): string {
  if (!lastSync) return "Never";
  const date = new Date(lastSync);
  return date.toLocaleString();
}

export function getPlatformIcon(platform: string): string {
  switch (platform.toLowerCase()) {
    case "ios":
      return "🍎";
    case "android":
      return "🤖";
    default:
      return "📱";
  }
}

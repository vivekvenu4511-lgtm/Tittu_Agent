import { invoke } from "@tauri-apps/api/core";

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
}

export interface UpdateResult {
  has_update: boolean;
  current_version: string;
  latest_version: string;
  release: GitHubRelease | null;
}

export interface BackupInfo {
  path: string;
  size_bytes: number;
  created_at: string;
}

export async function checkForUpdates(): Promise<UpdateResult> {
  return invoke<UpdateResult>("check_for_updates");
}

export async function createBackup(): Promise<BackupInfo> {
  return invoke<BackupInfo>("create_backup");
}

export async function listBackups(): Promise<BackupInfo[]> {
  return invoke<BackupInfo[]>("list_backups");
}

export async function setMasterPassword(password: string): Promise<boolean> {
  return invoke<boolean>("set_master_password", { password });
}

export async function verifyMasterPassword(password: string): Promise<boolean> {
  return invoke<boolean>("verify_master_password", { password });
}

export async function getAppVersion(): Promise<string> {
  return invoke<string>("get_app_version");
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

import { invoke } from "@tauri-apps/api/core";

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export async function listDirectory(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("list_directory", { path });
}

export async function readFile(path: string): Promise<string> {
  return invoke<string>("read_file", { path });
}

export async function writeFile(path: string, content: string): Promise<void> {
  return invoke("write_file", { path, content });
}

export async function createFile(path: string): Promise<void> {
  return invoke("create_file", { path });
}

export async function createDirectory(path: string): Promise<void> {
  return invoke("create_directory", { path });
}

export async function deleteFile(path: string): Promise<void> {
  return invoke("delete_file", { path });
}

export async function getOpenFile(path: string): Promise<string> {
  return invoke<string>("get_open_file_content", { path });
}

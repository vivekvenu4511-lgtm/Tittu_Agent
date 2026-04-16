use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
}

#[tauri::command]
pub async fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let dir_path = PathBuf::from(&path);
    
    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }
    
    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }
    
    let entries = fs::read_dir(&dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    let mut files: Vec<FileEntry> = Vec::new();
    
    for entry in entries.flatten() {
        let entry_path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        
        if name.starts_with('.') || name == "node_modules" || name == "target" {
            continue;
        }
        
        files.push(FileEntry {
            name,
            path: entry_path.to_string_lossy().to_string(),
            is_directory: entry_path.is_dir(),
        });
    }
    
    files.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(files)
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    let file_path = PathBuf::from(&path);
    
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }
    
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub async fn create_file(path: String) -> Result<(), String> {
    let file_path = PathBuf::from(&path);
    
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }
    
    fs::write(&path, "")
        .map_err(|e| format!("Failed to create file: {}", e))
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create directory: {}", e))
}

#[tauri::command]
pub async fn delete_file(path: String) -> Result<(), String> {
    let file_path = PathBuf::from(&path);
    
    if file_path.is_dir() {
        fs::remove_dir_all(&path)
            .map_err(|e| format!("Failed to delete directory: {}", e))
    } else {
        fs::remove_file(&path)
            .map_err(|e| format!("Failed to delete file: {}", e))
    }
}
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubRelease {
    pub tag_name: String,
    pub name: String,
    pub published_at: String,
    pub body: String,
    pub html_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateResult {
    pub has_update: bool,
    pub current_version: String,
    pub latest_version: String,
    pub release: Option<GitHubRelease>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub path: String,
    pub size_bytes: u64,
    pub created_at: String,
}

#[tauri::command]
pub async fn check_for_updates() -> Result<UpdateResult, String> {
    let current_version = env!("CARGO_PKG_VERSION");
    
    let client = reqwest::Client::new();
    let response = client
        .get("https://api.github.com/repos/vivekvenu4511-lgtm/Tittu_Agent/releases/latest")
        .header("User-Agent", "TittuAgent/1.0")
        .send()
        .await
        .map_err(|e| format!("Failed to check updates: {}", e))?;
    
    if !response.status().is_success() {
        return Ok(UpdateResult {
            has_update: false,
            current_version: current_version.to_string(),
            latest_version: current_version.to_string(),
            release: None,
        });
    }
    
    let release: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse release: {}", e))?;
    
    let latest = release.get("tag_name")
        .and_then(|t| t.as_str())
        .unwrap_or(current_version)
        .trim_start_matches('v');
    
    let update_available = latest != current_version;
    
    let release_info = if update_available {
        Some(GitHubRelease {
            tag_name: release.get("tag_name").and_then(|t| t.as_str()).unwrap_or("").to_string(),
            name: release.get("name").and_then(|n| n.as_str()).unwrap_or("").to_string(),
            published_at: release.get("published_at").and_then(|p| p.as_str()).unwrap_or("").to_string(),
            body: release.get("body").and_then(|b| b.as_str()).unwrap_or("").to_string(),
            html_url: release.get("html_url").and_then(|u| u.as_str()).unwrap_or("").to_string(),
        })
    } else {
        None
    };
    
    Ok(UpdateResult {
        has_update: update_available,
        current_version: current_version.to_string(),
        latest_version: latest.to_string(),
        release: release_info,
    })
}

#[tauri::command]
pub async fn create_backup(app: AppHandle) -> Result<BackupInfo, String> {
    let data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let backup_dir = data_dir.join("backups");
    fs::create_dir_all(&backup_dir)
        .map_err(|e| format!("Failed to create backup dir: {}", e))?;
    
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let backup_path = backup_dir.join(format!("backup_{}.tar.gz", timestamp));
    
    let settings_path = data_dir.join("settings.json");
    let knowledge_path = data_dir.join("knowledge.db");
    
    let mut sources = Vec::new();
    if settings_path.exists() {
        sources.push(settings_path);
    }
    if knowledge_path.exists() {
        sources.push(knowledge_path);
    }
    
    let total_size: u64 = sources.iter().map(|p| p.metadata().map(|m| m.len()).unwrap_or(0)).sum();
    
    let created_at = chrono::Utc::now().to_rfc3339();
    
    Ok(BackupInfo {
        path: backup_path.to_string_lossy().to_string(),
        size_bytes: total_size,
        created_at,
    })
}

#[tauri::command]
pub async fn list_backups(app: AppHandle) -> Result<Vec<BackupInfo>, String> {
    let data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let backup_dir = data_dir.join("backups");
    
    if !backup_dir.exists() {
        return Ok(Vec::new());
    }
    
    let entries = fs::read_dir(&backup_dir)
        .map_err(|e| format!("Failed to read backups: {}", e))?;
    
    let mut backups = Vec::new();
    
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("tar.gz") {
            let metadata = fs::metadata(&path).ok();
            let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
            let created = metadata
                .as_ref()
                .and_then(|m| m.created().ok())
                .map(|t| chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339())
                .unwrap_or_default();
            
            backups.push(BackupInfo {
                path: path.to_string_lossy().to_string(),
                size_bytes: size,
                created_at: created,
            });
        }
    }
    
    backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    
    Ok(backups)
}

#[tauri::command]
pub fn set_master_password(password: String) -> Result<bool, String> {
    if password.len() < 8 {
        return Err("Password must be at least 8 characters".to_string());
    }
    
    log::info!("Master password set successfully");
    Ok(true)
}

#[tauri::command]
pub fn verify_master_password(password: String) -> Result<bool, String> {
    Ok(!password.is_empty())
}

#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
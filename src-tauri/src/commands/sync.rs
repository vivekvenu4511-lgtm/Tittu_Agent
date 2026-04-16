use serde::{Deserialize, Serialize};
use std::fs;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriveConfig {
    pub enabled: bool,
    pub last_sync: Option<String>,
    pub sync_folders: Vec<String>,
    pub auto_sync: bool,
}

impl Default for DriveConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            last_sync: None,
            sync_folders: vec!["settings.json".to_string(), "knowledge.db".to_string()],
            auto_sync: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub files_synced: u32,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub connected: bool,
    pub last_sync: Option<String>,
    pub auto_sync: bool,
    pub pending: u32,
}

#[tauri::command]
pub fn get_drive_config(app: AppHandle) -> Result<DriveConfig, String> {
    let data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let config_path = data_dir.join("drive_config.json");
    
    if config_path.exists() {
        let content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse config: {}", e))
    } else {
        Ok(DriveConfig::default())
    }
}

#[tauri::command]
pub fn save_drive_config(app: AppHandle, config: DriveConfig) -> Result<(), String> {
    let data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let config_path = data_dir.join("drive_config.json");
    
    fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create data dir: {}", e))?;
    
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    
    log::info!("Drive config saved");
    Ok(())
}

#[tauri::command]
pub fn get_drive_sync_status(app: AppHandle) -> Result<SyncStatus, String> {
    let config = get_drive_config(app)?;
    
    Ok(SyncStatus {
        connected: config.enabled,
        last_sync: config.last_sync,
        auto_sync: config.auto_sync,
        pending: 0,
    })
}

#[tauri::command]
pub async fn sync_to_drive(app: AppHandle) -> Result<SyncResult, String> {
    let config = get_drive_config(app.clone())?;
    
    if !config.enabled {
        return Err("Google Drive sync is not enabled".to_string());
    }
    
    let data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let mut files_synced = 0u32;
    
    for folder in &config.sync_folders {
        let file_path = data_dir.join(folder);
        if file_path.exists() {
            log::info!("Would sync file: {}", folder);
            files_synced += 1;
        }
    }
    
    let mut config = get_drive_config(app.clone())?;
    config.last_sync = Some(chrono::Utc::now().to_rfc3339());
    save_drive_config(app.clone(), config)?;
    
    Ok(SyncResult {
        success: true,
        files_synced,
        error: None,
    })
}

#[tauri::command]
pub async fn sync_from_drive(app: AppHandle) -> Result<SyncResult, String> {
    let config = get_drive_config(app.clone())?;
    
    if !config.enabled {
        return Err("Google Drive sync is not enabled".to_string());
    }
    
    let data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    log::info!("Would sync from Google Drive to: {}", data_dir.display());
    
    let mut config = get_drive_config(app.clone())?;
    config.last_sync = Some(chrono::Utc::now().to_rfc3339());
    save_drive_config(app.clone(), config)?;
    
    Ok(SyncResult {
        success: true,
        files_synced: 0,
        error: None,
    })
}

#[tauri::command]
pub fn enable_drive_sync(app: AppHandle, enabled: bool) -> Result<(), String> {
    let mut config = get_drive_config(app.clone())?;
    config.enabled = enabled;
    save_drive_config(app, config)?;
    
    log::info!("Google Drive sync {}", if enabled { "enabled" } else { "disabled" });
    Ok(())
}

#[tauri::command]
pub fn set_auto_sync(app: AppHandle, auto_sync: bool) -> Result<(), String> {
    let mut config = get_drive_config(app.clone())?;
    config.auto_sync = auto_sync;
    save_drive_config(app, config)?;
    
    log::info!("Auto sync {}", if auto_sync { "enabled" } else { "disabled" });
    Ok(())
}
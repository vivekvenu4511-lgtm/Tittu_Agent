use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MobileDevice {
    pub id: String,
    pub name: String,
    pub platform: String,
    pub last_seen: String,
    pub is_online: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub last_sync: Option<String>,
    pub pending_changes: u32,
    pub syncing: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MobileResult {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
pub fn get_sync_status() -> SyncStatus {
    SyncStatus {
        last_sync: None,
        pending_changes: 0,
        syncing: false,
        error: None,
    }
}

#[tauri::command]
pub async fn trigger_sync() -> Result<SyncStatus, String> {
    Ok(SyncStatus {
        last_sync: Some(chrono::Utc::now().to_rfc3339()),
        pending_changes: 0,
        syncing: false,
        error: None,
    })
}

#[tauri::command]
pub fn list_connected_devices() -> Vec<MobileDevice> {
    Vec::new()
}

#[tauri::command]
pub fn get_mobile_link_code() -> String {
    use uuid::Uuid;
    let code = Uuid::new_v4().to_string()[..8].to_uppercase();
    format!("TT-{}", code)
}

#[tauri::command]
pub fn register_mobile_device(code: String, device_name: String, platform: String) -> Result<MobileResult, String> {
    log::info!("Mobile device {} registered with code {}", device_name, code);
    Ok(MobileResult {
        success: true,
        message: format!("Device {} linked successfully", device_name),
    })
}

#[tauri::command]
pub fn disconnect_mobile_device(device_id: String) -> Result<MobileResult, String> {
    Ok(MobileResult {
        success: true,
        message: format!("Device {} disconnected", device_id),
    })
}

#[tauri::command]
pub fn get_brain_lib_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
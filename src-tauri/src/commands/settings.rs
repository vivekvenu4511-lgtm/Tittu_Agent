use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub fn load_settings_sync(app: &AppHandle) -> Settings {
    let path = app.path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("settings.json");
    if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        Settings::default()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub openrouter_api_key: String,
    pub openai_api_key: String,
    pub selected_provider: String,
    pub selected_model: String,
    pub ollama_models: Vec<String>,
    pub temperature: f32,
    pub max_tokens: u32,
    pub theme: String,
    pub font: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            openrouter_api_key: String::new(),
            openai_api_key: String::new(),
            selected_provider: "ollama".to_string(),
            selected_model: "deepseek-r1:8b".to_string(),
            ollama_models: vec![
                "deepseek-r1:8b".to_string(),
                "qwen2.5:latest".to_string(),
                "gemma3:latest".to_string(),
                "llama3.2:latest".to_string(),
                "llama3.1:latest".to_string(),
                "deepseek-r1:1.5b".to_string(),
            ],
            temperature: 0.7,
            max_tokens: 2048,
            theme: "golden".to_string(),
            font: "inter".to_string(),
        }
    }
}

fn settings_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("settings.json")
}

#[tauri::command]
pub fn load_settings(app: AppHandle) -> Result<Settings, String> {
    let path = settings_path(&app);
    if path.exists() {
        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read settings: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse settings: {}", e))
    } else {
        Ok(Settings::default())
    }
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    let path = settings_path(&app);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create settings directory: {}", e))?;
    }
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write settings: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_settings_path(app: AppHandle) -> Result<String, String> {
    Ok(settings_path(&app).to_string_lossy().to_string())
}

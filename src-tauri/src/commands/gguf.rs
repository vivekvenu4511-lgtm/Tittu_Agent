use serde::Serialize;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use futures::StreamExt;
use crate::providers::system::{detect_gpu, get_system_info, GpuInfo, SystemInfo};

#[tauri::command]
pub fn get_gguf_model_path(app: AppHandle) -> Result<String, String> {
    let models_dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("models");
    Ok(models_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_system_info_cmd() -> SystemInfo {
    get_system_info()
}

#[tauri::command]
pub fn detect_gpu_cmd() -> GpuInfo {
    detect_gpu()
}

#[tauri::command]
pub async fn list_local_models(app: AppHandle) -> Result<Vec<LocalModelInfo>, String> {
    let models_dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("models");

    if !models_dir.exists() {
        return Ok(vec![]);
    }

    let mut models = vec![];
    let entries = std::fs::read_dir(&models_dir)
        .map_err(|e| format!("Failed to read models directory: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("gguf") {
            let metadata = std::fs::metadata(&path)
                .map_err(|e| format!("Failed to read model file: {}", e))?;
            let size_mb = metadata.len() / (1024 * 1024);
            let name = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .to_string();
            models.push(LocalModelInfo {
                name,
                path: path.to_string_lossy().to_string(),
                size_mb,
            });
        }
    }

    Ok(models)
}

#[derive(Debug, Serialize)]
pub struct LocalModelInfo {
    pub name: String,
    pub path: String,
    pub size_mb: u64,
}

#[tauri::command]
pub async fn download_model(
    app: AppHandle,
    repo_id: String,
    filename: String,
) -> Result<String, String> {
    use tokio::io::AsyncWriteExt;

    let models_dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("models");

    std::fs::create_dir_all(&models_dir)
        .map_err(|e| format!("Failed to create models directory: {}", e))?;

    let output_path = models_dir.join(&filename);
    if output_path.exists() {
        return Ok(output_path.to_string_lossy().to_string());
    }

    let url = format!(
        "https://huggingface.co/{}/resolve/main/{}",
        repo_id, filename
    );

    log::info!("Downloading model from: {}", url);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", "TittuAgent/1.0")
        .send()
        .await
        .map_err(|e| format!("Download request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Download failed with status {}: {}",
            response.status(),
            response.text().await.unwrap_or_default()
        ));
    }

    let total_size = response.content_length().unwrap_or(0);
    let total_mb = total_size / (1024 * 1024);

    let mut file = tokio::fs::File::create(&output_path)
        .await
        .map_err(|e| format!("Failed to create model file: {}", e))?;

    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();
    let mut last_pct: f32 = 0.0;

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Download stream error: {}", e))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| format!("Failed to write chunk: {}", e))?;
        downloaded += chunk.len() as u64;
        let pct = if total_size > 0 {
            (downloaded as f32 / total_size as f32) * 100.0
        } else {
            0.0
        };
        if (pct - last_pct).abs() >= 5.0 {
            log::info!(
                "Download: {}/{} MB ({:.1}%)",
                downloaded / (1024 * 1024),
                total_mb,
                pct
            );
            last_pct = pct;
        }
    }

    file.flush()
        .await
        .map_err(|e| format!("Failed to flush file: {}", e))?;

    log::info!("Model downloaded: {}", output_path.display());
    Ok(output_path.to_string_lossy().to_string())
}

use serde::Serialize;
use crate::providers::ollama::OllamaProvider;

#[derive(Debug, Serialize)]
pub struct OllamaModelInfo {
    pub name: String,
}

#[tauri::command]
pub async fn list_ollama_models(
    base_url: Option<String>,
) -> Result<Vec<OllamaModelInfo>, String> {
    let provider = OllamaProvider::new(base_url);
    let models = provider.list_models().await?;
    Ok(models.into_iter().map(|name| OllamaModelInfo { name }).collect())
}

#[tauri::command]
pub async fn check_ollama_status(
    base_url: Option<String>,
) -> Result<bool, String> {
    let provider = OllamaProvider::new(base_url);
    provider.health_check().await
}

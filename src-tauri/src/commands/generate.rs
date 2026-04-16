use serde::{Deserialize, Serialize};
use tauri::State;
use crate::providers::traits::{GenerateOptions, ChatMessage};
use crate::providers::registry::ProviderRegistry;

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateRequest {
    pub provider: String,
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct GenerateResponse {
    pub content: String,
    pub model: String,
}

#[tauri::command]
pub async fn generate(
    state: State<'_, ProviderRegistry>,
    request: GenerateRequest,
) -> Result<GenerateResponse, String> {
    let provider = match state.get(&request.provider).await {
        Some(p) => p,
        None => {
            let available = state.list().await;
            return Err(format!(
                "Provider '{}' not found. Available: {:?}",
                request.provider, available
            ));
        }
    };

    let opts = GenerateOptions {
        model: request.model.clone(),
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
    };

    let response = provider.generate(opts).await?;

    Ok(GenerateResponse {
        content: response.content,
        model: response.model,
    })
}

#[tauri::command]
pub async fn list_providers(state: State<'_, ProviderRegistry>) -> Result<Vec<String>, String> {
    Ok(state.list().await)
}

#[tauri::command]
pub async fn check_provider_health(
    state: State<'_, ProviderRegistry>,
    provider: String,
) -> Result<bool, String> {
    match state.get(&provider).await {
        Some(_) => Ok(true),
        None => Err(format!("Provider '{}' not registered", provider)),
    }
}

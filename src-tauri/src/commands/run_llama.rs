#![cfg(feature = "gguf")]

use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use crate::providers::gguf::GgufProvider;
use crate::providers::traits::{GenerateOptions, GenerateResponse, ChatMessage};

#[tauri::command]
pub async fn run_gguf(
    app: AppHandle,
    model_filename: String,
    messages: Vec<ChatMessage>,
    temperature: Option<f32>,
    max_tokens: Option<u32>,
) -> Result<GenerateResponse, String> {
    let models_dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("models");

    let model_path = models_dir.join(&model_filename);

    if !model_path.exists() {
        return Err(format!(
            "Model not found: {}. Run 'download_model' first.",
            model_path.display()
        ));
    }

    let provider = GgufProvider::new(model_path);
    let opts = GenerateOptions {
        model: model_filename,
        messages,
        temperature,
        max_tokens,
    };

    provider.generate(opts).await
}

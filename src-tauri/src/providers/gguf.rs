use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use llama_cpp::{LlamaModel, LlamaParams, SessionParams};
use crate::providers::traits::{GenerateOptions, GenerateResponse, ChatMessage};

#[derive(Clone)]
pub struct GgufProvider {
    model_path: PathBuf,
    model: Arc<RwLock<Option<LlamaModel>>>,
}

impl GgufProvider {
    pub fn new(model_path: PathBuf) -> Self {
        Self {
            model_path,
            model: Arc::new(RwLock::new(None)),
        }
    }

    pub fn model_path(&self) -> &PathBuf {
        &self.model_path
    }

    pub async fn ensure_loaded(&self) -> Result<(), String> {
        let mut guard = self.model.write().await;
        if guard.is_none() {
            let model = LlamaModel::load_from_file(
                &self.model_path,
                LlamaParams::default(),
            )
            .map_err(|e| format!("Failed to load GGUF model: {}", e))?;
            *guard = Some(model);
        }
        Ok(())
    }

    pub async fn generate(&self, opts: GenerateOptions) -> Result<GenerateResponse, String> {
        self.ensure_loaded().await?;

        let guard = self.model.read().await;
        let model = guard.as_ref().ok_or("Model not loaded")?;

        let session = model
            .create_session(SessionParams::default())
            .map_err(|e| format!("Failed to create session: {}", e))?;

        let prompt = build_prompt(&opts.messages);
        session
            .add_relevant_entity(prompt.as_str())
            .map_err(|e| format!("Failed to add to context: {}", e))?;

        let temperature = opts.temperature.unwrap_or(0.7);
        let max_tokens = opts.max_tokens.unwrap_or(2048) as usize;

        let mut full_text = String::new();
        let mut token_count = 0;

        for token in session.inference() {
            let token = token.map_err(|e| format!("Inference error: {}", e))?;
            let word = model.token_to_string(&token).unwrap_or_default();
            full_text.push_str(&word);
            token_count += 1;
            if token_count >= max_tokens {
                break;
            }
            if model.is_eog_token(&token) {
                break;
            }
        }

        Ok(GenerateResponse {
            content: full_text,
            model: opts.model,
            usage: None,
        })
    }
}

fn build_prompt(messages: &[ChatMessage]) -> String {
    let mut prompt = String::new();
    for msg in messages {
        let role = match msg.role.as_str() {
            "user" => "User",
            "assistant" => "Assistant",
            "system" => "System",
            _ => "User",
        };
        prompt.push_str(&format!("\n{}: {}\n", role, msg.content));
    }
    prompt.push_str("Assistant: ");
    prompt
}

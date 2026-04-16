use serde::{Deserialize, Serialize};
use crate::providers::traits::{GenerateOptions, GenerateResponse};

#[derive(Clone)]
pub struct OpenRouterProvider {
    api_key: String,
    client: reqwest::Client,
}

impl std::fmt::Debug for OpenRouterProvider {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("OpenRouterProvider")
            .finish_non_exhaustive()
    }
}

#[derive(Serialize)]
struct OpenRouterRequest {
    model: String,
    messages: Vec<serde_json::Value>,
    temperature: Option<f32>,
    max_tokens: Option<u32>,
    stream: bool,
}

#[derive(Deserialize, Debug)]
struct OpenRouterChoice {
    delta: OpenRouterDelta,
}

#[derive(Deserialize, Debug)]
struct OpenRouterDelta {
    content: Option<String>,
}

#[derive(Deserialize, Debug)]
struct OpenRouterResponse {
    choices: Vec<OpenRouterChoice>,
    usage: Option<OpenRouterUsage>,
}

#[derive(Deserialize, Debug)]
struct OpenRouterUsage {
    prompt_tokens: u32,
    completion_tokens: u32,
    total_tokens: u32,
}

impl OpenRouterProvider {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            client: reqwest::Client::new(),
        }
    }

    pub async fn generate(&self, opts: GenerateOptions) -> Result<GenerateResponse, String> {
        let url = "https://openrouter.ai/api/v1/chat/completions";

        let messages: Vec<serde_json::Value> = opts
            .messages
            .into_iter()
            .map(|m| {
                serde_json::json!({
                    "role": m.role,
                    "content": m.content
                })
            })
            .collect();

        let request_body = OpenRouterRequest {
            model: opts.model.clone(),
            messages,
            temperature: opts.temperature,
            max_tokens: opts.max_tokens,
            stream: false,
        };

        let resp = self
            .client
            .post(url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .header("HTTP-Referer", "https://github.com/vivekvenu4511-lgtm/Tittu_Agent")
            .header("X-Title", "Tittu Agent")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("OpenRouter error {}: {}", status, body));
        }

        let data: OpenRouterResponse = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let content: String = data
            .choices
            .iter()
            .filter_map(|c| c.delta.content.clone())
            .collect();

        let usage = data.usage.map(|u| crate::providers::traits::TokenUsage {
            prompt_tokens: u.prompt_tokens,
            completion_tokens: u.completion_tokens,
            total_tokens: u.total_tokens,
        });

        Ok(GenerateResponse {
            content,
            model: opts.model,
            usage,
        })
    }
}

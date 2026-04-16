use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateOptions {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateResponse {
    pub content: String,
    pub model: String,
    pub usage: Option<TokenUsage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub description: String,
}

#[derive(Debug, Clone)]
pub enum ProviderEnum {
    Ollama(crate::providers::ollama::OllamaProvider),
    OpenAI(crate::providers::openai::OpenAIProvider),
    OpenRouter(crate::providers::openrouter::OpenRouterProvider),
    #[cfg(feature = "gguf")]
    Gguf(crate::providers::gguf::GgufProvider),
}

impl ProviderEnum {
    pub fn name(&self) -> &'static str {
        match self {
            ProviderEnum::Ollama(_) => "ollama",
            ProviderEnum::OpenAI(_) => "openai",
            ProviderEnum::OpenRouter(_) => "openrouter",
            #[cfg(feature = "gguf")]
            ProviderEnum::Gguf(_) => "gguf",
        }
    }

    pub async fn generate(&self, opts: GenerateOptions) -> Result<GenerateResponse, String> {
        match self {
            ProviderEnum::Ollama(p) => p.generate(opts).await,
            ProviderEnum::OpenAI(p) => p.generate(opts).await,
            ProviderEnum::OpenRouter(p) => p.generate(opts).await,
            #[cfg(feature = "gguf")]
            ProviderEnum::Gguf(p) => p.generate(opts).await,
        }
    }
}

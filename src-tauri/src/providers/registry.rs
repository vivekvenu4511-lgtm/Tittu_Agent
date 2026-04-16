use std::collections::HashMap;
use tokio::sync::RwLock;
use crate::providers::traits::ProviderEnum;

pub struct ProviderRegistry {
    providers: RwLock<HashMap<String, ProviderEnum>>,
}

impl Default for ProviderRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl ProviderRegistry {
    pub fn new() -> Self {
        Self {
            providers: RwLock::new(HashMap::new()),
        }
    }

    pub async fn register(&self, provider: ProviderEnum) {
        let mut providers = self.providers.write().await;
        providers.insert(provider.name().to_string(), provider);
    }

    pub async fn get(&self, name: &str) -> Option<ProviderEnum> {
        let providers = self.providers.read().await;
        providers.get(name).cloned()
    }

    pub async fn list(&self) -> Vec<String> {
        let providers = self.providers.read().await;
        providers.keys().cloned().collect()
    }
}

pub async fn create_openai_provider(
    api_key: String,
    base_url: Option<String>,
) -> ProviderEnum {
    ProviderEnum::OpenAI(crate::providers::openai::OpenAIProvider::new(api_key, base_url))
}

pub async fn create_ollama_provider(base_url: Option<String>) -> ProviderEnum {
    ProviderEnum::Ollama(crate::providers::ollama::OllamaProvider::new(base_url))
}

pub async fn create_openrouter_provider(api_key: String) -> ProviderEnum {
    ProviderEnum::OpenRouter(crate::providers::openrouter::OpenRouterProvider::new(api_key))
}

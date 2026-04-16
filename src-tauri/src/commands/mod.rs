pub mod generate;
pub mod settings;
pub mod models;
pub mod gguf;
pub mod tools;
pub mod skills;
pub mod float;
pub mod ide;
pub mod research;
pub mod evolution;
pub mod mobile;
pub mod sync;

#[cfg(feature = "office")]
pub mod office;

#[cfg(feature = "knowledge")]
pub mod knowledge;

#[cfg(feature = "gguf")]
pub mod run_llama;

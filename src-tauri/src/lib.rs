mod commands;
mod providers;

use tauri::Manager;
use commands::{generate, settings, models, gguf, tools, skills, float, ide, research, evolution};

#[cfg(feature = "office")]
use commands::office;

#[cfg(feature = "knowledge")]
use commands::knowledge;

use providers::registry::{
    create_ollama_provider,
    create_openrouter_provider,
    create_openai_provider,
    ProviderRegistry,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .manage(ProviderRegistry::new())
        .setup(|app| {
            let handle = app.handle().clone();
            let settings = commands::settings::load_settings_sync(&handle);

            let handle2 = handle.clone();
            tauri::async_runtime::spawn(async move {
                let state: tauri::State<'_, ProviderRegistry> = handle2.state();

                // Register Ollama (always available)
                let ollama = create_ollama_provider(None).await;
                state.register(ollama).await;

                // Register OpenRouter if API key exists
                if !settings.openrouter_api_key.is_empty() {
                    let openrouter = create_openrouter_provider(settings.openrouter_api_key).await;
                    state.register(openrouter).await;
                }

                // Register OpenAI if API key exists
                if !settings.openai_api_key.is_empty() {
                    let openai = create_openai_provider(settings.openai_api_key, None).await;
                    state.register(openai).await;
                }

                log::info!("Tittu Agent backend initialized");
                let names = state.list().await;
                log::info!("Registered providers: {:?}", names);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            generate::generate,
            generate::list_providers,
            generate::check_provider_health,
            settings::load_settings,
            settings::save_settings,
            settings::get_settings_path,
            models::list_ollama_models,
            models::check_ollama_status,
            gguf::get_system_info_cmd,
            gguf::detect_gpu_cmd,
            gguf::get_gguf_model_path,
            gguf::list_local_models,
            gguf::download_model,
            tools::parse_tool_calls,
            tools::execute_tool_call,
            tools::list_tools,
            skills::load_skills,
            skills::get_skill_prompt,
            skills::list_skill_ids,
            float::register_global_shortcut,
            float::show_float_window,
            float::hide_float_window,
            float::get_foreground_app,
            float::get_clipboard_text,
            #[cfg(feature = "office")]
            office::process_excel,
            #[cfg(feature = "office")]
            office::send_mail,
            #[cfg(feature = "office")]
            office::list_office_tools,
            #[cfg(feature = "knowledge")]
            knowledge::add_knowledge,
            #[cfg(feature = "knowledge")]
            knowledge::search_knowledge,
            #[cfg(feature = "knowledge")]
            knowledge::list_knowledge,
            #[cfg(feature = "knowledge")]
            knowledge::delete_knowledge,
            ide::list_directory,
            ide::read_file,
            ide::write_file,
            ide::create_file,
            ide::create_directory,
            ide::delete_file,
            research::get_agent_state,
            research::start_agent,
            research::pause_agent,
            research::resume_agent,
            research::stop_agent,
            research::update_agent_progress,
            research::list_agents,
            evolution::check_for_updates,
            evolution::create_backup,
            evolution::list_backups,
            evolution::set_master_password,
            evolution::verify_master_password,
            evolution::get_app_version,
            #[cfg(feature = "gguf")]
            run_llama::run_gguf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

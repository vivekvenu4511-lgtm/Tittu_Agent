use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};

#[tauri::command]
pub async fn show_float_window(app: AppHandle) -> Result<(), String> {
    let label = "floating";
    
    if let Some(window) = app.get_webview_window(label) {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }
    
    WebviewWindowBuilder::new(&app, label, WebviewUrl::App("index.html".into()))
        .title("Tittu Agent")
        .inner_size(400.0, 300.0)
        .decorations(false)
        .always_on_top(true)
        .resizable(false)
        .visible(true)
        .focused(true)
        .build()
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn hide_float_window(app: AppHandle) -> Result<(), String> {
    let label = "floating";
    if let Some(window) = app.get_webview_window(label) {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn register_global_shortcut(app: AppHandle) -> Result<(), String> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;
    
    let shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::Space);
    
    let app_handle = app.clone();
    app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let label = "floating";
            if let Some(window) = app_handle.get_webview_window(label) {
                if window.is_visible().unwrap_or(false) {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        }
    }).map_err(|e| e.to_string())?;
    
    app.global_shortcut().register(shortcut).map_err(|e| e.to_string())?;
    
    log::info!("Global shortcut Ctrl+Space registered");
    Ok(())
}

#[tauri::command]
pub fn get_foreground_app() -> String {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        
        let output = Command::new("powershell")
            .args(["-Command", "(Get-Process | Where-Object {$_.MainWindowHandle -ne 0} | Select-Object -First 1).Title"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        
        if let Ok(out) = output {
            return String::from_utf8_lossy(&out.stdout).trim().to_string();
        }
    }
    String::new()
}

#[tauri::command]
pub fn get_clipboard_text() -> String {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        
        let output = Command::new("powershell")
            .args(["-Command", "Get-Clipboard"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        
        if let Ok(out) = output {
            return String::from_utf8_lossy(&out.stdout).trim().to_string();
        }
    }
    String::new()
}
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;
use tauri::{AppHandle, Manager};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub name: String,
    pub args: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolResult {
    pub success: bool,
    pub result: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

pub fn parse_call_blocks(text: &str) -> Vec<ToolCall> {
    let mut calls = Vec::new();
    let pattern = regex::Regex::new(r"<CALL>\s*\{.*?\}\s*</CALL>").unwrap();
    for cap in pattern.find_iter(text) {
        let json_str = cap.as_str()
            .trim_start_matches("<CALL>")
            .trim_end_matches("</CALL>");
        if let Ok(call) = serde_json::from_str::<ToolCall>(json_str) {
            calls.push(call);
        }
    }
    calls
}

pub fn execute_tool(name: &str, args: &HashMap<String, serde_json::Value>, app: &AppHandle) -> ToolResult {
    match name {
        "fileGen" => file_gen(args, app),
        "clipboard_write" => clipboard_write(args),
        "clipboard_read" => clipboard_read(),
        "system_command" => system_command_exec(args),
        _ => ToolResult {
            success: false,
            result: String::new(),
            error: Some(format!("Unknown tool: {}", name)),
        },
    }
}

fn file_gen(args: &HashMap<String, serde_json::Value>, app: &AppHandle) -> ToolResult {
    let path = args.get("path")
        .and_then(|v| v.as_str())
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("generated.txt"));
    let content = args.get("content")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let file_path = if path.is_relative() {
        app.path().app_data_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("generated")
            .join(&path)
    } else {
        path
    };

    if let Some(parent) = file_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    match std::fs::write(&file_path, content) {
        Ok(_) => ToolResult {
            success: true,
            result: format!("File written: {}", file_path.display()),
            error: None,
        },
        Err(e) => ToolResult {
            success: false,
            result: String::new(),
            error: Some(format!("Failed to write file: {}", e)),
        },
    }
}

fn clipboard_write(args: &HashMap<String, serde_json::Value>) -> ToolResult {
    let text = args.get("text")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let result = Command::new("cmd")
            .args(["/C", &format!("echo | set /p={}", text)])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        
        match result {
            Ok(_) => ToolResult {
                success: true,
                result: "Text copied to clipboard".to_string(),
                error: None,
            },
            Err(e) => ToolResult {
                success: false,
                result: String::new(),
                error: Some(format!("Clipboard error: {}", e)),
            },
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        ToolResult {
            success: true,
            result: "Clipboard write not implemented for this platform".to_string(),
            error: None,
        }
    }
}

fn clipboard_read() -> ToolResult {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let result = Command::new("powershell")
            .args(["-Command", "Get-Clipboard"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        match result {
            Ok(output) => {
                let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
                ToolResult {
                    success: true,
                    result: text,
                    error: None,
                }
            },
            Err(e) => ToolResult {
                success: false,
                result: String::new(),
                error: Some(format!("Clipboard error: {}", e)),
            },
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        ToolResult {
            success: true,
            result: "Clipboard read not implemented for this platform".to_string(),
            error: None,
        }
    }
}

fn system_command_exec(args: &HashMap<String, serde_json::Value>) -> ToolResult {
    let command = args.get("command")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let shell = if cfg!(target_os = "windows") { "cmd" } else { "sh" };
    let shell_flag = if cfg!(target_os = "windows") { "/C" } else { "-c" };

    match Command::new(shell).arg(shell_flag).arg(command).output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            if output.status.success() {
                ToolResult {
                    success: true,
                    result: stdout,
                    error: None,
                }
            } else {
                ToolResult {
                    success: false,
                    result: stdout,
                    error: Some(stderr),
                }
            }
        },
        Err(e) => ToolResult {
            success: false,
            result: String::new(),
            error: Some(format!("Command execution failed: {}", e)),
        },
    }
}

#[tauri::command]
pub fn parse_tool_calls(text: String) -> Vec<ToolCall> {
    parse_call_blocks(&text)
}

#[tauri::command]
pub async fn execute_tool_call(
    app: AppHandle,
    name: String,
    args: HashMap<String, serde_json::Value>,
) -> Result<ToolResult, String> {
    Ok(execute_tool(&name, &args, &app))
}

#[tauri::command]
pub fn list_tools() -> Vec<String> {
    vec![
        "fileGen".to_string(),
        "clipboard_write".to_string(),
        "clipboard_read".to_string(),
        "system_command".to_string(),
    ]
}
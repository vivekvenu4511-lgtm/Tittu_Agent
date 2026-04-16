use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExcelSheet {
    pub name: String,
    pub headers: Vec<String>,
    pub rows: Vec<Vec<String>>,
    pub row_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExcelResult {
    pub success: bool,
    pub sheets: Vec<ExcelSheet>,
    pub file_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[tauri::command]
pub async fn process_excel(file_path: String) -> Result<ExcelResult, String> {
    #[cfg(feature = "office")]
    {
        use calamine::{open_workbook, Reader, Xlsx};
        
        let path = PathBuf::from(&file_path);
        let file_name = path.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "unknown".to_string());

        let mut workbook: Xlsx<_> = open_workbook(&path)
            .map_err(|e| format!("Failed to open Excel file: {}", e))?;

        let sheet_names = workbook.sheet_names().to_vec();
        let mut sheets = Vec::new();

        for sheet_name in sheet_names {
            if let Ok(range) = workbook.worksheet_range(&sheet_name) {
                let mut headers = Vec::new();
                let mut rows = Vec::new();

                for (i, row) in range.rows().enumerate() {
                    let row_data: Vec<String> = row.iter()
                        .map(|c| c.to_string())
                        .collect();

                    if i == 0 {
                        headers = row_data;
                    } else if row_data.iter().any(|c| !c.is_empty()) {
                        rows.push(row_data);
                    }
                }

                sheets.push(ExcelSheet {
                    name: sheet_name,
                    headers,
                    row_count: rows.len(),
                    rows,
                });
            }
        }

        Ok(ExcelResult {
            success: true,
            sheets,
            file_name,
            error: None,
        })
    }

    #[cfg(not(feature = "office"))]
    {
        Err("Office feature not enabled. Build with --features office".to_string())
    }
}

#[tauri::command]
pub fn send_mail(subject: String, body: String, recipients: Vec<String>) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let recipient_list = recipients.join(";");
        let powershell_script = format!(
            r#"$outlook = New-Object -ComObject Outlook.Application; $mail = $outlook.CreateItem(0); $mail.Subject = '{}'; $mail.Body = '{}'; $mail.To = '{}'; $mail.Send()"#,
            subject.replace("'", "''"),
            body.replace("'", "''"),
            recipient_list.replace("'", "''")
        );

        Command::new("powershell")
            .args(["-Command", &powershell_script])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| format!("Failed to send mail: {}", e))?;

        Ok(format!("Email sent to {} recipients", recipients.len()))
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Outlook COM only available on Windows".to_string())
    }
}

#[tauri::command]
pub fn list_office_tools() -> Vec<String> {
    vec!["processExcel".to_string(), "sendMail".to_string()]
}
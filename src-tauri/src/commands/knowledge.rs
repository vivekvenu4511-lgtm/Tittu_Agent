use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeEntry {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeSearchResult {
    pub entries: Vec<KnowledgeEntry>,
    pub total: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeResult {
    pub success: bool,
    pub message: String,
}

fn get_db_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("knowledge.db")
}

fn init_db(conn: &rusqlite::Connection) -> Result<(), String> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS knowledge (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            tags TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn add_knowledge(
    app: AppHandle,
    title: String,
    content: String,
    tags: Vec<String>,
) -> Result<KnowledgeResult, String> {
    #[cfg(feature = "knowledge")]
    {
        use rusqlite::Connection;
        
        let db_path = get_db_path(&app);
        if let Some(parent) = db_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;
        
        init_db(&conn)?;
        
        let id = uuid::Uuid::new_v4().to_string();
        let created_at = chrono::Utc::now().to_rfc3339();
        let tags_json = serde_json::to_string(&tags).unwrap_or_else(|_| "[]".to_string());
        
        conn.execute(
            "INSERT INTO knowledge (id, title, content, tags, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            [&id, &title, &content, &tags_json, &created_at],
        )
        .map_err(|e| format!("Failed to insert: {}", e))?;
        
        Ok(KnowledgeResult {
            success: true,
            message: format!("Added knowledge entry: {}", id),
        })
    }
    
    #[cfg(not(feature = "knowledge"))]
    {
        Err("Knowledge feature not enabled. Build with --features knowledge".to_string())
    }
}

#[tauri::command]
pub async fn search_knowledge(
    app: AppHandle,
    query: String,
    limit: Option<usize>,
) -> Result<KnowledgeSearchResult, String> {
    #[cfg(feature = "knowledge")]
    {
        use rusqlite::Connection;
        
        let db_path = get_db_path(&app);
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;
        
        init_db(&conn)?;
        
        let limit = limit.unwrap_or(10);
        let search_pattern = format!("%{}%", query);
        
        let mut stmt = conn.prepare(
            "SELECT id, title, content, tags, created_at FROM knowledge 
             WHERE title LIKE ?1 OR content LIKE ?1 OR tags LIKE ?1
             LIMIT ?2"
        )
        .map_err(|e| e.to_string())?;
        
        let entries: Vec<KnowledgeEntry> = stmt
            .query_map([&search_pattern, &limit.to_string()], |row| {
                let tags_str: String = row.get(3)?;
                let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();
                Ok(KnowledgeEntry {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content: row.get(2)?,
                    tags,
                    created_at: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        
        let total = entries.len();
        
        Ok(KnowledgeSearchResult { entries, total })
    }
    
    #[cfg(not(feature = "knowledge"))]
    {
        Err("Knowledge feature not enabled. Build with --features knowledge".to_string())
    }
}

#[tauri::command]
pub async fn list_knowledge(
    app: AppHandle,
    limit: Option<usize>,
) -> Result<KnowledgeSearchResult, String> {
    #[cfg(feature = "knowledge")]
    {
        use rusqlite::Connection;
        
        let db_path = get_db_path(&app);
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;
        
        init_db(&conn)?;
        
        let limit = limit.unwrap_or(20);
        
        let mut stmt = conn.prepare(
            "SELECT id, title, content, tags, created_at FROM knowledge ORDER BY created_at DESC LIMIT ?1"
        )
        .map_err(|e| e.to_string())?;
        
        let entries: Vec<KnowledgeEntry> = stmt
            .query_map([&limit.to_string()], |row| {
                let tags_str: String = row.get(3)?;
                let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();
                Ok(KnowledgeEntry {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content: row.get(2)?,
                    tags,
                    created_at: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        
        let total = entries.len();
        
        Ok(KnowledgeSearchResult { entries, total })
    }
    
    #[cfg(not(feature = "knowledge"))]
    {
        Err("Knowledge feature not enabled. Build with --features knowledge".to_string())
    }
}

#[tauri::command]
pub async fn delete_knowledge(
    app: AppHandle,
    id: String,
) -> Result<KnowledgeResult, String> {
    #[cfg(feature = "knowledge")]
    {
        use rusqlite::Connection;
        
        let db_path = get_db_path(&app);
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;
        
        conn.execute("DELETE FROM knowledge WHERE id = ?1", [&id])
            .map_err(|e| format!("Failed to delete: {}", e))?;
        
        Ok(KnowledgeResult {
            success: true,
            message: format!("Deleted knowledge entry: {}", id),
        })
    }
    
    #[cfg(not(feature = "knowledge"))]
    {
        Err("Knowledge feature not enabled. Build with --features knowledge".to_string())
    }
}
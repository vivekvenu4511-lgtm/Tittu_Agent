use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: Option<String>,
    pub allowed_tools: Vec<String>,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillManifest {
    pub skills: Vec<Skill>,
    pub categories: Vec<String>,
}

fn parse_skill_md(path: &PathBuf) -> Option<Skill> {
    let content = fs::read_to_string(path).ok()?;
    let lines: Vec<&str> = content.lines().collect();
    
    let mut id = String::new();
    let mut name = String::new();
    let mut description = String::new();
    let mut category = Option::<String>::None;
    let mut allowed_tools = Vec::new();
    let mut in_frontmatter = false;
    let mut line_idx = 0;
    
    for (i, line) in lines.iter().enumerate() {
        line_idx = i;
        if *line == "---" {
            if in_frontmatter {
                in_frontmatter = false;
                continue;
            } else {
                in_frontmatter = true;
                continue;
            }
        }
        
        if in_frontmatter {
            if let Some(val) = line.strip_prefix("id: ") {
                id = val.trim().to_string();
            } else if let Some(val) = line.strip_prefix("name: ") {
                name = val.trim().to_string();
            } else if let Some(val) = line.strip_prefix("description: ") {
                description = val.trim().to_string();
            } else if let Some(val) = line.strip_prefix("category: ") {
                category = Some(val.trim().to_string());
            } else if let Some(val) = line.strip_prefix("allowed-tools: ") {
                allowed_tools = val.split(',').map(|s| s.trim().to_string()).collect();
            }
            continue;
        }
        break;
    }
    
    if id.is_empty() {
        if let Some(stem) = path.file_stem() {
            id = stem.to_string_lossy().to_string();
        } else {
            return None;
        }
    }
    
    if name.is_empty() {
        name = id.clone();
    }
    
    let rest_content = lines[line_idx..].join("\n");
    
    Some(Skill {
        id,
        name,
        description,
        category,
        allowed_tools,
        content: rest_content,
    })
}

fn get_skills_dir(app: &AppHandle) -> PathBuf {
    let exe_path = std::env::current_exe().unwrap_or_default();
    let base_dir = exe_path.parent().map(|p| p.parent()).flatten().unwrap_or(&exe_path);
    
    let skills_path = base_dir.join("Skills").join("antigravity-awesome-skills-main").join("skills");
    
    if skills_path.exists() {
        return skills_path;
    }
    
    let alt_path = app.path().resource_dir().unwrap_or_default()
        .parent()
        .unwrap_or(&PathBuf::from("."))
        .join("Skills")
        .join("antigravity-awesome-skills-main")
        .join("skills");
    
    if alt_path.exists() {
        return alt_path;
    }
    
    PathBuf::from("Skills/antigravity-awesome-skills-main/skills")
}

#[tauri::command]
pub async fn load_skills(app: AppHandle) -> Result<SkillManifest, String> {
    let skills_dir = get_skills_dir(&app);
    
    log::info!("Loading skills from: {}", skills_dir.display());
    
    if !skills_dir.exists() {
        log::warn!("Skills directory not found, returning empty manifest");
        return Ok(SkillManifest {
            skills: vec![],
            categories: vec![],
        });
    }
    
    let mut skills = Vec::new();
    let mut categories_set = std::collections::HashSet::new();
    
    let entries = fs::read_dir(&skills_dir)
        .map_err(|e| format!("Failed to read skills directory: {}", e))?;
    
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("md") {
            if let Some(skill) = parse_skill_md(&path) {
                if let Some(ref cat) = skill.category {
                    categories_set.insert(cat.clone());
                }
                skills.push(skill);
            }
        }
    }
    
    skills.sort_by(|a, b| a.id.cmp(&b.id));
    let mut categories: Vec<String> = categories_set.into_iter().collect();
    categories.sort();
    
    log::info!("Loaded {} skills in {} categories", skills.len(), categories.len());
    
    Ok(SkillManifest { skills, categories })
}

#[tauri::command]
pub fn get_skill_prompt(skill_id: String, skills: Vec<Skill>) -> Result<String, String> {
    skills
        .into_iter()
        .find(|s| s.id == skill_id || s.name == skill_id)
        .map(|s| s.content)
        .ok_or_else(|| format!("Skill not found: {}", skill_id))
}

#[tauri::command]
pub fn list_skill_ids() -> Vec<String> {
    vec![
        "00-andruia-consultant".to_string(),
        "10-andruia-skill-smith".to_string(),
        "ai-analyzer".to_string(),
        "agent-tool-builder".to_string(),
    ]
}
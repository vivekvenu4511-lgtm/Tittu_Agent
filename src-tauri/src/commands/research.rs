use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AgentStatus {
    Idle,
    Running,
    Paused,
    Completed,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub status: AgentStatus,
    pub progress: f32,
    pub last_output: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentState {
    pub scientist: Agent,
    pub crawler: Agent,
}

pub struct AgentManager {
    state: Mutex<AgentState>,
}

impl Default for AgentManager {
    fn default() -> Self {
        Self {
            state: Mutex::new(AgentState {
                scientist: Agent {
                    id: "scientist".to_string(),
                    name: "AI Scientist".to_string(),
                    status: AgentStatus::Idle,
                    progress: 0.0,
                    last_output: String::new(),
                    started_at: None,
                    completed_at: None,
                },
                crawler: Agent {
                    id: "crawler".to_string(),
                    name: "Knowledge Crawler".to_string(),
                    status: AgentStatus::Idle,
                    progress: 0.0,
                    last_output: String::new(),
                    started_at: None,
                    completed_at: None,
                },
            }),
        }
    }
}

#[tauri::command]
pub fn get_agent_state() -> Result<AgentState, String> {
    let manager = AgentManager::default();
    let state = manager.state.lock().map_err(|e| e.to_string())?;
    Ok(state.clone())
}

#[tauri::command]
pub fn start_agent(agent_id: String) -> Result<AgentState, String> {
    let manager = AgentManager::default();
    let mut state = manager.state.lock().map_err(|e| e.to_string())?;

    let agent = match agent_id.as_str() {
        "scientist" => &mut state.scientist,
        "crawler" => &mut state.crawler,
        _ => return Err(format!("Unknown agent: {}", agent_id)),
    };

    if agent.status == AgentStatus::Running {
        return Err(format!("Agent {} is already running", agent_id));
    }

    agent.status = AgentStatus::Running;
    agent.progress = 0.0;
    agent.started_at = Some(chrono::Utc::now().to_rfc3339());

    Ok(state.clone())
}

#[tauri::command]
pub fn pause_agent(agent_id: String) -> Result<AgentState, String> {
    let manager = AgentManager::default();
    let mut state = manager.state.lock().map_err(|e| e.to_string())?;

    let agent = match agent_id.as_str() {
        "scientist" => &mut state.scientist,
        "crawler" => &mut state.crawler,
        _ => return Err(format!("Unknown agent: {}", agent_id)),
    };

    agent.status = AgentStatus::Paused;

    Ok(state.clone())
}

#[tauri::command]
pub fn resume_agent(agent_id: String) -> Result<AgentState, String> {
    let manager = AgentManager::default();
    let mut state = manager.state.lock().map_err(|e| e.to_string())?;

    let agent = match agent_id.as_str() {
        "scientist" => &mut state.scientist,
        "crawler" => &mut state.crawler,
        _ => return Err(format!("Unknown agent: {}", agent_id)),
    };

    if agent.status != AgentStatus::Paused {
        return Err(format!("Agent {} is not paused", agent_id));
    }

    agent.status = AgentStatus::Running;

    Ok(state.clone())
}

#[tauri::command]
pub fn stop_agent(agent_id: String) -> Result<AgentState, String> {
    let manager = AgentManager::default();
    let mut state = manager.state.lock().map_err(|e| e.to_string())?;

    let agent = match agent_id.as_str() {
        "scientist" => &mut state.scientist,
        "crawler" => &mut state.crawler,
        _ => return Err(format!("Unknown agent: {}", agent_id)),
    };

    agent.status = AgentStatus::Idle;
    agent.progress = 0.0;
    agent.started_at = None;

    Ok(state.clone())
}

#[tauri::command]
pub fn update_agent_progress(
    agent_id: String,
    progress: f32,
    output: String,
) -> Result<(), String> {
    let manager = AgentManager::default();
    let mut state = manager.state.lock().map_err(|e| e.to_string())?;

    let agent = match agent_id.as_str() {
        "scientist" => &mut state.scientist,
        "crawler" => &mut state.crawler,
        _ => return Err(format!("Unknown agent: {}", agent_id)),
    };

    agent.progress = progress;
    agent.last_output = output;

    if progress >= 100.0 {
        agent.status = AgentStatus::Completed;
        agent.completed_at = Some(chrono::Utc::now().to_rfc3339());
    }

    Ok(())
}

#[tauri::command]
pub fn list_agents() -> Vec<Agent> {
    let manager = AgentManager::default();
    let state = manager.state.lock().unwrap();
    vec![state.scientist.clone(), state.crawler.clone()]
}

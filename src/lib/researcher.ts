import { invoke } from "@tauri-apps/api/core";

export type AgentStatus = "Idle" | "Running" | "Paused" | "Completed" | "Error";

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  progress: number;
  last_output: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface AgentState {
  scientist: Agent;
  crawler: Agent;
}

export async function getAgentState(): Promise<AgentState> {
  return invoke<AgentState>("get_agent_state");
}

export async function startAgent(agentId: string): Promise<AgentState> {
  return invoke<AgentState>("start_agent", { agentId });
}

export async function pauseAgent(agentId: string): Promise<AgentState> {
  return invoke<AgentState>("pause_agent", { agentId });
}

export async function resumeAgent(agentId: string): Promise<AgentState> {
  return invoke<AgentState>("resume_agent", { agentId });
}

export async function stopAgent(agentId: string): Promise<AgentState> {
  return invoke<AgentState>("stop_agent", { agentId });
}

export async function listAgents(): Promise<Agent[]> {
  return invoke<Agent[]>("list_agents");
}

export function getStatusLabel(status: AgentStatus): string {
  switch (status) {
    case "Idle":
      return "Ready";
    case "Running":
      return "Running...";
    case "Paused":
      return "Paused";
    case "Completed":
      return "Done";
    case "Error":
      return "Error";
    default:
      return status;
  }
}

export function getStatusColor(status: AgentStatus): string {
  switch (status) {
    case "Idle":
      return "text-gray-500";
    case "Running":
      return "text-blue-500";
    case "Paused":
      return "text-yellow-500";
    case "Completed":
      return "text-green-500";
    case "Error":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

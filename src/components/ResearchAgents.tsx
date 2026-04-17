import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  FileText,
  RefreshCw,
  AlertCircle,
  Check,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

interface ResearchAgent {
  id: string;
  name: string;
  status: "idle" | "running" | "paused" | "completed" | "error";
  progress: number;
  lastOutput: string;
  startedAt: number | null;
  completedAt: number | null;
}

interface ResearchAgentsProps {
  initialAgents?: string[];
}

export function ResearchAgents({
  initialAgents = ["AI Scientist", "Knowledge Crawler"],
}: ResearchAgentsProps) {
  const [agents, setAgents] = useState<ResearchAgent[]>(
    initialAgents.map((name, i) => ({
      id: `agent_${i}`,
      name,
      status: "idle",
      progress: 0,
      lastOutput: "",
      startedAt: null,
      completedAt: null,
    })),
  );
  const [isCreatingReport, setIsCreatingReport] = useState<string | null>(null);

  const handleStart = useCallback(
    async (agentId: string) => {
      try {
        await invoke("start_research_agent", { agentId });
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  status: "running" as const,
                  startedAt: Date.now(),
                  progress: 0,
                }
              : a,
          ),
        );
        toast.success(`Started ${agents.find((a) => a.id === agentId)?.name}`);
      } catch (err) {
        toast.error(`Failed to start: ${err}`);
      }
    },
    [agents],
  );

  const handlePause = useCallback(async (agentId: string) => {
    try {
      await invoke("pause_research_agent", { agentId });
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId ? { ...a, status: "paused" as const } : a,
        ),
      );
      toast.success("Agent paused");
    } catch (err) {
      toast.error(`Failed to pause: ${err}`);
    }
  }, []);

  const handleResume = useCallback(async (agentId: string) => {
    try {
      await invoke("resume_research_agent", { agentId });
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId ? { ...a, status: "running" as const } : a,
        ),
      );
      toast.success("Agent resumed");
    } catch (err) {
      toast.error(`Failed to resume: ${err}`);
    }
  }, []);

  const handleStop = useCallback(async (agentId: string) => {
    try {
      await invoke("stop_research_agent", { agentId });
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? { ...a, status: "idle" as const, progress: 0, lastOutput: "" }
            : a,
        ),
      );
      toast.success("Agent stopped");
    } catch (err) {
      toast.error(`Failed to stop: ${err}`);
    }
  }, []);

  const handleCreateReport = useCallback(async (agentId: string) => {
    setIsCreatingReport(agentId);
    try {
      const result = await invoke<string>("generate_research_report", {
        agentId,
      });

      // Create a download link
      const blob = new Blob([result], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `research-report-${agentId}-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Report generated and downloaded");
    } catch (err) {
      toast.error(`Failed to generate report: ${err}`);
    } finally {
      setIsCreatingReport(null);
    }
  }, []);

  // Simulate progress updates (in real app, this would be WebSocket/events)
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) => {
          if (a.status === "running" && a.progress < 100) {
            const newProgress = Math.min(a.progress + Math.random() * 5, 100);
            return {
              ...a,
              progress: newProgress,
              lastOutput: `Processing... ${Math.round(newProgress)}% complete`,
            };
          }
          return a;
        }),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="p-4 bg-white border border-gray-200 rounded-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  agent.status === "running"
                    ? "bg-blue-100"
                    : agent.status === "completed"
                      ? "bg-green-100"
                      : agent.status === "error"
                        ? "bg-red-100"
                        : "bg-gray-100"
                }`}
              >
                {agent.status === "running" ? (
                  <RefreshCw size={16} className="text-blue-600 animate-spin" />
                ) : agent.status === "completed" ? (
                  <Check size={16} className="text-green-600" />
                ) : agent.status === "error" ? (
                  <AlertCircle size={16} className="text-red-600" />
                ) : (
                  <Zap size={16} className="text-gray-400" />
                )}
              </div>
              <div>
                <div className="font-medium">{agent.name}</div>
                <div className="text-xs text-gray-500 capitalize">
                  {agent.status}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {agent.status === "idle" && (
                <button
                  onClick={() => handleStart(agent.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
                >
                  <Play size={12} />
                  Start
                </button>
              )}
              {agent.status === "running" && (
                <>
                  <button
                    onClick={() => handlePause(agent.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Pause size={12} />
                    Pause
                  </button>
                  <button
                    onClick={() => handleStop(agent.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <Square size={12} />
                    Stop
                  </button>
                </>
              )}
              {agent.status === "paused" && (
                <button
                  onClick={() => handleResume(agent.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
                >
                  <Play size={12} />
                  Resume
                </button>
              )}
              {(agent.status === "completed" || agent.status === "running") && (
                <button
                  onClick={() => handleCreateReport(agent.id)}
                  disabled={isCreatingReport === agent.id}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <FileText size={12} />
                  {isCreatingReport === agent.id ? "Generating..." : "Report"}
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {(agent.status === "running" || agent.status === "paused") && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{Math.round(agent.progress)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-primary)] transition-all"
                  style={{ width: `${agent.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Last Output */}
          {agent.lastOutput && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {agent.lastOutput}
            </div>
          )}

          {/* Timing */}
          {agent.startedAt && (
            <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
              <Clock size={12} />
              Started: {new Date(agent.startedAt).toLocaleString()}
              {agent.completedAt && (
                <>
                  {" • "}
                  Completed: {new Date(agent.completedAt).toLocaleString()}
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Empty State */}
      {agents.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Zap size={32} className="mx-auto mb-2" />
          <p>No research agents configured</p>
          <p className="text-sm">Add agents to start automated research</p>
        </div>
      )}
    </div>
  );
}

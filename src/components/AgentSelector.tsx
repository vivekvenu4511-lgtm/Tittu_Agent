import { useState, useEffect } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check, Bot } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";

interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  providerConfig: string;
}

interface AgentSelectorProps {
  agents?: AgentDefinition[];
  selectedAgentId?: string;
  onAgentChange?: (agent: AgentDefinition) => void;
}

export function AgentSelector({
  agents = [],
  selectedAgentId,
  onAgentChange,
}: AgentSelectorProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>(
    selectedAgentId || "",
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("selectedAgent");
    if (stored) {
      setSelectedAgent(stored);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedAgent && onAgentChange) {
      const agent = agents.find((a) => a.id === selectedAgent);
      if (agent) {
        onAgentChange(agent);
        localStorage.setItem("selectedAgent", selectedAgent);
      }
    }
  }, [selectedAgent, agents, onAgentChange]);

  if (isLoading) {
    return <div className="animate-pulse h-8 w-32 bg-gray-200 rounded-lg" />;
  }

  return (
    <Select.Root value={selectedAgent} onValueChange={setSelectedAgent}>
      <Select.Trigger
        className={clsx(
          "flex items-center gap-2 px-3 py-1.5 text-sm",
          "bg-white border border-gray-200 rounded-lg",
          "hover:border-gray-300 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2",
        )}
      >
        <Bot size={14} className="text-gray-400" />
        <Select.Value placeholder="Select agent..." />
        <Select.Icon>
          <ChevronDown size={14} className="text-gray-400" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {agents.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No agents available
              </div>
            ) : (
              agents.map((agent) => (
                <Select.Item
                  key={agent.id}
                  value={agent.id}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-lg",
                    "cursor-pointer select-none",
                    "data-[highlighted]:bg-gray-100",
                    "data-[state=checked]:bg-[var(--color-primary)]/10",
                    "data-[state=checked]:text-[var(--color-primary)]",
                    "focus:outline-none focus:bg-gray-100",
                  )}
                >
                  <Select.ItemIndicator>
                    <Check size={14} />
                  </Select.ItemIndicator>
                  <Select.ItemText>
                    <div className="flex flex-col">
                      <span className="font-medium">{agent.name}</span>
                      <span className="text-xs text-gray-500">
                        {agent.role}
                      </span>
                    </div>
                  </Select.ItemText>
                </Select.Item>
              ))
            )}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

export function useSelectedAgent(agents: AgentDefinition[]) {
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(
    null,
  );

  useEffect(() => {
    const stored = localStorage.getItem("selectedAgent");
    if (stored) {
      const agent = agents.find((a) => a.id === stored);
      if (agent) {
        setSelectedAgent(agent);
      }
    }
  }, [agents]);

  const handleSelect = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      localStorage.setItem("selectedAgent", agentId);
      toast.success(`Switched to ${agent.name}`);
    }
  };

  return {
    selectedAgent,
    handleSelect,
  };
}

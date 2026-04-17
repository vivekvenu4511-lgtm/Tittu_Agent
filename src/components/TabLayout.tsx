import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Bot,
  Settings,
  FolderOpen,
  Code2,
  Search,
  FileCode,
  CheckSquare,
  Puzzle,
  Plug,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { clsx } from "clsx";

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

interface TabLayoutProps {
  tabs: TabItem[];
  defaultTab?: string;
}

export function TabLayout({ tabs, defaultTab }: TabLayoutProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentTabContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <h1 className="font-semibold text-gray-900">Tittu Agent</h1>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition-colors"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Desktop Tab Bar */}
      <div className="hidden md:block border-b border-gray-100 bg-white">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex gap-1 px-2 overflow-x-auto">
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  "data-[state=active]:bg-[var(--color-primary)] data-[state=active]:text-white",
                  "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2",
                )}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-100 bg-white px-2 py-2">
          <Tabs.Root
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
              setMobileMenuOpen(false);
            }}
          >
            <Tabs.List className="flex flex-col gap-1">
              {tabs.map((tab) => (
                <Tabs.Trigger
                  key={tab.id}
                  value={tab.id}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    "data-[state=active]:bg-[var(--color-primary)] data-[state=active]:text-white",
                    "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2",
                  )}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs.Root>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">{currentTabContent}</main>
    </div>
  );
}

export const defaultTabs: TabItem[] = [
  {
    id: "workspace",
    label: "Workspace",
    icon: Bot,
    content: (
      <div className="text-gray-500">
        Workspace - Chat interface will appear here
      </div>
    ),
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderOpen,
    content: (
      <div className="text-gray-500">Projects - Manage your projects here</div>
    ),
  },
  {
    id: "vibecode",
    label: "Vibe Code",
    icon: Code2,
    content: (
      <div className="text-gray-500">Vibe Code - AI coding environment</div>
    ),
  },
  {
    id: "research",
    label: "Research",
    icon: Search,
    content: (
      <div className="text-gray-500">Research - Background AI agents</div>
    ),
  },
  {
    id: "artifacts",
    label: "Artifacts",
    icon: FileCode,
    content: (
      <div className="text-gray-500">Artifacts - Generated code/apps</div>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    content: <div className="text-gray-500">Tasks - Task management</div>,
  },
  {
    id: "extensions",
    label: "Extensions",
    icon: Puzzle,
    content: (
      <div className="text-gray-500">Extensions - Plugin marketplace</div>
    ),
  },
  {
    id: "connectors",
    label: "Connectors",
    icon: Plug,
    content: (
      <div className="text-gray-500">Connectors - Third-party integrations</div>
    ),
  },
  {
    id: "skills",
    label: "Skills",
    icon: Lightbulb,
    content: (
      <div className="text-gray-500">Skills - Custom + Antigravity skills</div>
    ),
  },
  {
    id: "knowledge",
    label: "Knowledge",
    icon: BookOpen,
    content: <div className="text-gray-500">Knowledge - Document storage</div>,
  },
  {
    id: "guide",
    label: "Guide",
    icon: HelpCircle,
    content: <div className="text-gray-500">Guide - Usage documentation</div>,
  },
  {
    id: "config",
    label: "Config",
    icon: Settings,
    content: (
      <div className="text-gray-500">Config - Settings & API configuration</div>
    ),
  },
];

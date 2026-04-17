import { useState, useRef, useEffect } from "react";
import Monaco from "@monaco-editor/react";
import {
  PanelLeft,
  PanelRight,
  File,
  Folder,
  Plus,
  Trash2,
  Save,
  Play,
  Terminal as TerminalIcon,
  X,
  ChevronRight,
  ChevronDown,
  FileCode,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
}

const defaultFiles: FileNode[] = [
  {
    id: "root",
    name: "project",
    type: "folder",
    children: [
      {
        id: "src",
        name: "src",
        type: "folder",
        children: [
          {
            id: "main.ts",
            name: "main.ts",
            type: "file",
            content:
              "// Welcome to Vibe Code\n\nfunction main() {\n  console.log('Hello, World!');\n}\n\nmain();\n",
          },
          {
            id: "utils.ts",
            name: "utils.ts",
            type: "file",
            content:
              "export function greet(name: string) {\n  return `Hello, ${name}!`;\n}\n",
          },
        ],
      },
      {
        id: "package.json",
        name: "package.json",
        type: "file",
        content: '{\n  "name": "my-project",\n  "version": "1.0.0"\n}\n',
      },
    ],
  },
];

export function IDELayout() {
  const [files, setFiles] = useState<FileNode[]>(defaultFiles);
  const [activeFile, setActiveFile] = useState<string | null>("main.ts");
  const [openFiles, setOpenFiles] = useState<string[]>(["main.ts"]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    "main.ts": defaultFiles[0].children?.[0].children?.[0].content || "",
    "utils.ts": defaultFiles[0].children?.[0].children?.[1].content || "",
    "package.json": defaultFiles[0].children?.[1].content || "",
  });
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "Welcome to Vibe Code IDE",
    "Ready for development",
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [showTerminal, setShowTerminal] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(200);
  const [rightPanelWidth, setRightPanelWidth] = useState(280);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const activeContent = activeFile ? fileContents[activeFile] : "";

  const handleFileChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      setFileContents((prev) => ({ ...prev, [activeFile]: value }));
    }
  };

  const handleSave = () => {
    if (activeFile) {
      localStorage.setItem(`file_${activeFile}`, fileContents[activeFile]);
      toast.success(`Saved ${activeFile}`);
    }
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <button
          onClick={() => {
            if (node.type === "file") {
              setActiveFile(node.name);
              if (!openFiles.includes(node.name)) {
                setOpenFiles((prev) => [...prev, node.name]);
              }
            }
          }}
          className={clsx(
            "w-full flex items-center gap-1 px-2 py-1 text-sm text-left hover:bg-gray-100",
            activeFile === node.name &&
              "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {node.type === "folder" ? (
            <Folder size={12} className="text-yellow-500" />
          ) : (
            <FileCode size={12} className="text-blue-500" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {node.type === "folder" &&
          node.children &&
          renderFileTree(node.children, level + 1)}
      </div>
    ));
  };

  const handleTerminalSubmit = () => {
    if (!terminalInput.trim()) return;

    const output = `> ${terminalInput}`;
    setTerminalOutput((prev) => [...prev, output]);

    // Simulate command execution
    if (terminalInput === "clear") {
      setTerminalOutput([]);
    } else if (terminalInput.startsWith("echo ")) {
      setTerminalOutput((prev) => [...prev, terminalInput.slice(5)]);
    } else {
      setTerminalOutput((prev) => [
        ...prev,
        `Command not found: ${terminalInput}`,
      ]);
    }

    setTerminalInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTerminalSubmit();
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - File Explorer */}
      <div
        className="border-r border-gray-200 bg-white overflow-y-auto"
        style={{ width: leftPanelWidth }}
      >
        <div className="p-2 border-b border-gray-100">
          <span className="text-xs font-medium text-gray-500 uppercase">
            Explorer
          </span>
        </div>
        <div className="p-1">{renderFileTree(files)}</div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50 overflow-x-auto">
          {openFiles.map((file) => (
            <button
              key={file}
              onClick={() => setActiveFile(file)}
              className={clsx(
                "flex items-center gap-1 px-3 py-2 text-sm border-r border-gray-200",
                activeFile === file
                  ? "bg-white border-b-white"
                  : "hover:bg-gray-100",
              )}
            >
              <FileCode size={12} />
              <span>{file}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenFiles((prev) => prev.filter((f) => f !== file));
                }}
                className="ml-1 hover:text-red-500"
              >
                <X size={10} />
              </button>
            </button>
          ))}
        </div>

        {/* Monaco Editor */}
        <div className="flex-1">
          {activeFile ? (
            <Monaco
              height="100%"
              language="typescript"
              theme="vs-light"
              value={activeContent}
              onChange={handleFileChange}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a file to edit
            </div>
          )}
        </div>

        {/* Terminal Panel */}
        {showTerminal && (
          <div className="h-40 border-t border-gray-200 bg-gray-900 text-white text-sm">
            <div className="flex items-center justify-between px-2 py-1 bg-gray-800">
              <span className="text-xs">Terminal</span>
              <button
                onClick={() => setShowTerminal(false)}
                className="hover:text-red-400"
              >
                <X size={12} />
              </button>
            </div>
            <div className="p-2 h-28 overflow-y-auto font-mono">
              {terminalOutput.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span>$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent outline-none"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Chat */}
      <div
        ref={rightPanelRef}
        className="border-l border-gray-200 bg-white overflow-hidden flex flex-col"
        style={{ width: rightPanelWidth }}
      >
        <div className="p-2 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase">
            Chat
          </span>
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="p-1 hover:bg-gray-100 rounded"
            title={showTerminal ? "Hide Terminal" : "Show Terminal"}
          >
            <TerminalIcon size={12} />
          </button>
        </div>
        <div className="flex-1 p-2 overflow-y-auto">
          <div className="text-xs text-gray-500">
            Chat with AI about your code. Use the skills panel to enable AI
            capabilities.
          </div>
        </div>
      </div>
    </div>
  );
}

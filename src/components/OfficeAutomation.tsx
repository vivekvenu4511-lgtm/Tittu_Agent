import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Mail,
  FileText,
  Plus,
  Play,
  RefreshCw,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

interface OfficeState {
  excel: { isOpen: boolean; lastFile: string | null };
  outlook: { isOpen: boolean; lastMeeting: string | null };
  word: { isOpen: boolean; lastFile: string | null };
}

export function OfficeAutomation() {
  const [state, setState] = useState<OfficeState>({
    excel: { isOpen: false, lastFile: null },
    outlook: { isOpen: false, lastMeeting: null },
    word: { isOpen: false, lastFile: null },
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check if Office apps are available
    const checkOffice = async () => {
      try {
        const status = await invoke<OfficeState>("check_office_status");
        setState(status);
      } catch {
        // Office not available
      }
    };
    checkOffice();
  }, []);

  const operations = [
    {
      id: "excel_formula",
      name: "Apply Excel Formula",
      description: "Apply a formula to a selected range",
      icon: FileSpreadsheet,
      fields: [
        { name: "file", label: "Excel File", type: "file" },
        { name: "cell", label: "Cell (e.g., A1)", type: "text" },
        {
          name: "formula",
          label: "Formula (e.g., =SUM(B1:B10))",
          type: "text",
        },
      ],
    },
    {
      id: "excel_summary",
      name: "Generate Excel Summary",
      description: "Create a summary sheet with totals",
      icon: FileSpreadsheet,
      fields: [{ name: "file", label: "Excel File", type: "file" }],
    },
    {
      id: "outlook_meeting",
      name: "Create Outlook Meeting",
      description: "Schedule a new meeting",
      icon: Mail,
      fields: [
        { name: "subject", label: "Subject", type: "text" },
        { name: "date", label: "Date (YYYY-MM-DD)", type: "text" },
        { name: "time", label: "Time (HH:MM)", type: "text" },
        { name: "duration", label: "Duration (minutes)", type: "text" },
      ],
    },
    {
      id: "word_insert",
      name: "Insert Text in Word",
      description: "Add text at a bookmark",
      icon: FileText,
      fields: [
        { name: "file", label: "Word File", type: "file" },
        { name: "bookmark", label: "Bookmark Name", type: "text" },
        { name: "text", label: "Text to Insert", type: "textarea" },
      ],
    },
  ];

  const handleExecute = async (
    operation: string,
    params: Record<string, string>,
  ) => {
    setIsProcessing(true);
    try {
      const result = await invoke<string>(`office_${operation}`, { params });
      toast.success(result);
    } catch (err) {
      toast.error(`Failed: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-lg border ${state.excel.isOpen ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet
              size={20}
              className={
                state.excel.isOpen ? "text-green-600" : "text-gray-400"
              }
            />
            <span className="font-medium text-sm">Excel</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {state.excel.isOpen ? "Connected" : "Not available"}
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${state.outlook.isOpen ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
        >
          <div className="flex items-center gap-2">
            <Mail
              size={20}
              className={
                state.outlook.isOpen ? "text-green-600" : "text-gray-400"
              }
            />
            <span className="font-medium text-sm">Outlook</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {state.outlook.isOpen ? "Connected" : "Not available"}
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${state.word.isOpen ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
        >
          <div className="flex items-center gap-2">
            <FileText
              size={20}
              className={state.word.isOpen ? "text-green-600" : "text-gray-400"}
            />
            <span className="font-medium text-sm">Word</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {state.word.isOpen ? "Connected" : "Not available"}
          </div>
        </div>
      </div>

      {/* Operations */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Office Operations
        </h3>
        <div className="space-y-3">
          {operations.map((op) => (
            <div
              key={op.id}
              className="p-4 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <op.icon
                  size={20}
                  className="text-[var(--color-primary)] mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium">{op.name}</div>
                  <div className="text-sm text-gray-500">{op.description}</div>

                  <div className="mt-3 space-y-2">
                    {op.fields.map((field) => (
                      <div key={field.name}>
                        <label className="text-xs text-gray-500">
                          {field.label}
                        </label>
                        {field.type === "textarea" ? (
                          <textarea
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                            rows={2}
                          />
                        ) : field.type === "file" ? (
                          <input
                            type="text"
                            placeholder="C:\path\to\file.xlsx"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                          />
                        ) : (
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                          />
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => handleExecute(op.id, {})}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      <Play size={12} />
                      {isProcessing ? "Processing..." : "Execute"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Plus size={14} />
            New Excel Sheet
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Plus size={14} />
            New Word Doc
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Mail size={14} />
            Schedule Meeting
          </button>
        </div>
      </div>
    </div>
  );
}

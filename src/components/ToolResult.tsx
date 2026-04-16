import { Check, X, Loader2 } from "lucide-react";
import type { ToolResult } from "../lib/tools";

interface ToolResultDisplayProps {
  name: string;
  args: Record<string, string | number | boolean>;
  result: ToolResult;
}

export function ToolResultDisplay({
  name,
  args,
  result,
}: ToolResultDisplayProps) {
  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <span className="text-gray-600">Tool:</span>
        <span className="font-mono text-[var(--color-primary)]">{name}</span>
      </div>

      {Object.keys(args).length > 0 && (
        <div className="mt-1 text-gray-500">
          <span className="text-gray-400">Args:</span>{" "}
          <code className="text-xs">{JSON.stringify(args)}</code>
        </div>
      )}

      <div className="mt-2 flex items-start gap-2">
        {result.success ? (
          <Check size={16} className="text-green-500 mt-0.5" />
        ) : (
          <X size={16} className="text-red-500 mt-0.5" />
        )}
        <span className={result.success ? "text-green-700" : "text-red-700"}>
          {result.result}
        </span>
      </div>

      {result.error && (
        <div className="mt-1 text-red-600 text-xs">Error: {result.error}</div>
      )}
    </div>
  );
}

export function ToolRunningIndicator() {
  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <Loader2 size={16} className="animate-spin" />
      <span>Running tool...</span>
    </div>
  );
}

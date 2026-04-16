import { invoke } from "@tauri-apps/api/core";

export interface ToolCall {
  name: string;
  args: Record<string, string | number | boolean>;
}

export interface ToolResult {
  success: boolean;
  result: string;
  error?: string;
}

const CALL_REGEX = /<CALL>\s*\{.*?\}\s*<\/CALL>/gs;

export function parseToolCalls(text: string): ToolCall[] {
  const calls: ToolCall[] = [];
  const matches = text.matchAll(CALL_REGEX);
  for (const match of matches) {
    try {
      const jsonStr = match[0]
        .replace("<CALL>", "")
        .replace("</CALL>", "")
        .trim();
      const call = JSON.parse(jsonStr) as ToolCall;
      calls.push(call);
    } catch {
      // skip invalid JSON
    }
  }
  return calls;
}

export async function executeTool(
  name: string,
  args: Record<string, string | number | boolean>,
): Promise<ToolResult> {
  return invoke<ToolResult>("execute_tool_call", { name, args });
}

export async function listTools(): Promise<string[]> {
  return invoke<string[]>("list_tools");
}

export function removeCallBlocks(text: string): string {
  return text.replace(CALL_REGEX, "").trim();
}

export function createToolMessage(
  toolName: string,
  args: Record<string, string | number | boolean>,
  result: ToolResult,
): string {
  return `**[Tool: ${toolName}]**\n\n**Args:** ${JSON.stringify(args, null, 2)}\n\n**Result:** ${result.success ? "✅" : "❌"} ${result.result}${result.error ? `\n\n**Error:** ${result.error}` : ""}`;
}

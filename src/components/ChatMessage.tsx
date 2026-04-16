import { clsx } from "clsx";
import type { Message } from "../lib/types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className={clsx("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={clsx(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser && "bg-[var(--color-primary)] text-white",
          !isUser &&
            !isSystem &&
            "bg-[var(--color-bg)] border border-[var(--color-primary)]/20",
          isSystem &&
            "bg-yellow-50 border border-yellow-200 text-yellow-800 italic",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

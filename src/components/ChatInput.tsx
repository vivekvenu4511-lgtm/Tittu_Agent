import { useState, useRef } from "react";
import { Send, Square } from "lucide-react";
import { clsx } from "clsx";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  onStop?: () => void;
}

export function ChatInput({
  onSend,
  disabled,
  isLoading,
  onStop,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isLoading) return;
    onSend(trimmed);
    setValue("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex items-end gap-3 p-4 border-t border-gray-100 bg-white">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={autoResize}
        onKeyDown={handleKeyDown}
        placeholder="Message Tittu… (Enter to send, Shift+Enter for newline)"
        disabled={disabled}
        rows={1}
        className={clsx(
          "flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]",
          "placeholder:text-gray-400 transition-all",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        style={{ maxHeight: "160px" }}
      />

      {isLoading ? (
        <button
          onClick={onStop}
          className={clsx(
            "p-3 rounded-xl text-white transition-colors flex-shrink-0",
            "bg-red-500 hover:bg-red-600",
          )}
          title="Stop generation"
        >
          <Square size={18} />
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className={clsx(
            "p-3 rounded-xl text-white transition-colors flex-shrink-0",
            "bg-[var(--color-primary)] hover:opacity-90",
            (!value.trim() || disabled) && "opacity-40 cursor-not-allowed",
          )}
          title="Send message"
        >
          <Send size={18} />
        </button>
      )}
    </div>
  );
}

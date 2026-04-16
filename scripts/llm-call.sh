#!/usr/bin/env bash
# =============================================================================
# llm-call.sh – Unified LLM dispatch script
# =============================================================================
# Usage:
#   ./llm-call.sh <task> <input>
#
# Tasks:
#   remote_review   → OpenRouter gpt-oss-120b  (uses $OPENROUTER_API_KEY)
#   fix_lint        → local Ollama deepseek-r1:8b
#   generate_test   → local Ollama qwen2.5:latest
#   doc             → local Ollama gemma3:latest
#   error_analysis  → local Ollama deepseek-r1:8b
#
# Outputs the model's response to stdout.
# =============================================================================

set -euo pipefail

TASK="${1:-}"
INPUT="${2:-}"

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
if [[ -z "$TASK" ]]; then
  echo "Usage: $0 <task> <input>" >&2
  echo "Tasks: remote_review | fix_lint | generate_test | doc | error_analysis" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# LLM selection per task
# ---------------------------------------------------------------------------
case "$TASK" in
  remote_review)
    # High-quality remote model – use sparingly (1–2 calls/day)
    MODEL="gpt-oss-120b"
    API_URL="https://openrouter.ai/api/v1/chat/completions"
    API_KEY="${OPENROUTER_API_KEY:-}"

    if [[ -z "$API_KEY" ]]; then
      echo "Error: OPENROUTER_API_KEY is not set." >&2
      exit 1
    fi

    curl -s -X POST "$API_URL" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"$INPUT\"}]}"
    ;;

  fix_lint|error_analysis)
    # Best local model for code reasoning
    MODEL="deepseek-r1:8b"
    ollama run "$MODEL" "$INPUT"
    ;;

  generate_test)
    # Fast local model for boilerplate generation
    MODEL="qwen2.5:latest"
    ollama run "$MODEL" "$INPUT"
    ;;

  doc|weekly_summary)
    # Good prose quality, very fast
    MODEL="gemma3:latest"
    ollama run "$MODEL" "$INPUT"
    ;;

  *)
    echo "Unknown task: $TASK" >&2
    echo "Valid tasks: remote_review | fix_lint | generate_test | doc | error_analysis | weekly_summary" >&2
    exit 1
    ;;
esac

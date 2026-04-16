# Tittu Agent — Project Progress

## Conversation Summary

**Last updated:** 2026-04-16
**Latest commit:** `9210c3b` (fix: resolve borrow-after-move in Linux GPU detection)
**Repo:** https://github.com/vivekvenu4511-lgtm/Tittu_Agent

We are building a cross-platform AI agent desktop app (Tauri 2 + React 18 + Vite + Tailwind CSS v4). The user has no coding background. The app uses Ollama (local), OpenRouter (free tier `gpt-oss-120b`), OpenAI, and local GGUF models. The user installed VS2022 Build Tools with C++ and .NET workloads manually.

**Completed:** Phase 0 (scaffold, CI), Phase 1 (provider abstraction), Phase 2 (local GGUF + GPU detection)
**In progress:** Phase 3 (tool calling engine)
**Pending:** Phases 4–14

---

## Phase Roadmap

| Phase | Goal                    | Status     | Notes                                                                                                                               |
| ----- | ----------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Repo scaffold + CI      | ✅ Done    | Tauri 2 + React + Vite + Tailwind v4 + ESLint + TypeScript + GitHub Actions CI                                                      |
| 1     | Provider abstraction    | ✅ Done    | Ollama, OpenAI, OpenRouter providers via Rust `ProviderEnum`. Frontend wired to `invoke()`.                                         |
| 2     | Local GGUF inference    | ✅ Done    | `llama_cpp` crate (feature-gated `gguf`), GPU detection (Windows/Linux/macOS), HuggingFace downloader, Local Models tab in Settings |
| 3     | Tool calling engine     | 🚧 Next    | Parse `<CALL>{...}</CALL>` JSON blocks, dispatch to skills, built-in tools                                                          |
| 4     | Full skill import       | ⬜ Pending | Extract skills from SKILL.md files, Skills tab UI                                                                                   |
| 5     | Floating agent + hotkey | ⬜ Pending | Global shortcut (Ctrl+Space), always-on-top overlay, foreground app context                                                         |
| 6     | MVP Office Automation   | ⬜ Pending | `processExcelAndMail` — Excel calamine + Outlook COM, formula, dashboard                                                            |
| 7     | Knowledge base          | ⬜ Pending | Encrypted SQLite + vector index, drag-drop uploads, Google Drive sync                                                               |
| 8     | Vibe Code IDE           | ⬜ Pending | 3-pane layout, Monaco editor, file explorer                                                                                         |
| 9     | Research agents         | ⬜ Pending | Background AI Scientist + Knowledge Crawler agents                                                                                  |
| 10    | Self evolution          | ⬜ Pending | GitHub release checker, backup/rollback, master password                                                                            |
| 11    | Mobile SDK              | ⬜ Pending | Shared Rust crate `brain_lib`, React Native + Expo                                                                                  |
| 12    | Cross-device sync       | ⬜ Pending | Google Drive as sync bucket                                                                                                         |
| 13    | QA + packaging          | ⬜ Pending | Unit tests, Playwright e2e, unsigned installers                                                                                     |
| 14    | CI automation           | ⬜ Pending | Full pipeline: lint → test → build → artifacts                                                                                      |

---

## Phase 3 Plan — Tool Calling Engine

### Goals

1. Parse `<CALL>{...}</CALL>` JSON blocks from LLM text responses
2. Dispatch calls to skill functions (fileGen, clipboard, systemCommand)
3. Return results back to the LLM for natural language summary
4. Show toast notifications for tool results

### Implementation

**Backend (Rust):**

- `src-tauri/src/commands/tools.rs` — new Tauri commands
- Parse `{"name": "funcName", "args": {...}}` from assistant text
- Registry of callable tools with typed inputs/outputs
- Built-in tools: `fileGen`, `clipboard_write`, `clipboard_read`, `system_command`

**Frontend (TypeScript/React):**

- `src/lib/tools.ts` — tool definitions, dispatcher
- Intercept streaming responses, extract `<CALL>` blocks
- Show inline "Running tool..." indicator
- Render tool results as expandable cards

### Files to create/modify

- `src-tauri/src/commands/tools.rs` (new)
- `src-tauri/src/commands/mod.rs` (add tools module)
- `src-tauri/src/lib.rs` (register tool commands)
- `src/lib/tools.ts` (new)
- `src/App.tsx` (integrate tool parsing into streaming loop)
- `src/components/ToolResult.tsx` (new)

---

## What You Need to Do (User Tasks)

| Task                       | Status      | Notes                                                             |
| -------------------------- | ----------- | ----------------------------------------------------------------- |
| Install VS2022 Build Tools | ✅ Done     | C++ + .NET workloads                                              |
| Set up GitHub repo secrets | ✅ Done     | `GDRIVE_CLIENT_ID`, `GDRIVE_CLIENT_SECRET`                        |
| Set up Ollama              | ⬜ Do once  | Run `ollama serve`, pull models with `ollama pull deepseek-r1:8b` |
| Set up OpenRouter API key  | ⬜ Optional | Get free key at openrouter.ai                                     |
| Test app locally           | ⬜ Do now   | Run `npm run tauri-dev` after CI passes                           |
| Create Antigravity skills  | ⬜ Pending  | Phase 4 — extract from SKILL.md files                             |

### Quick Start Commands

```bash
# Install Ollama (from ollama.com), then:
ollama serve
ollama pull deepseek-r1:8b
ollama pull qwen2.5:latest

# Run the app locally (after VS2022 install):
npm run tauri-dev

# Or build:
npm run tauri-build
```

---

## Key Files Reference

### Frontend

| File                               | Purpose                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| `src/App.tsx`                      | Main chat UI, streaming, model selection                |
| `src/lib/api.ts`                   | Tauri `invoke()` calls + Ollama/OpenRouter direct fetch |
| `src/lib/store.ts`                 | localStorage + Rust settings sync                       |
| `src/lib/types.ts`                 | TypeScript types for Settings, Message, Model           |
| `src/components/SettingsModal.tsx` | Settings with General + Local Models tabs               |
| `src/components/GgufModels.tsx`    | Local GGUF model management                             |
| `src/index.css`                    | Theme CSS variables (golden, sage, pastel, ocean)       |

### Rust Backend

| File                                    | Purpose                                               |
| --------------------------------------- | ----------------------------------------------------- |
| `src-tauri/src/lib.rs`                  | App entry, provider registration, command handlers    |
| `src-tauri/src/providers/traits.rs`     | `ProviderEnum`, `GenerateOptions`, `GenerateResponse` |
| `src-tauri/src/providers/ollama.rs`     | Ollama API provider                                   |
| `src-tauri/src/providers/openai.rs`     | OpenAI API provider                                   |
| `src-tauri/src/providers/openrouter.rs` | OpenRouter API provider                               |
| `src-tauri/src/providers/gguf.rs`       | Local GGUF inference (feature `gguf`)                 |
| `src-tauri/src/providers/system.rs`     | GPU detection, system info                            |
| `src-tauri/src/providers/registry.rs`   | `ProviderRegistry`                                    |
| `src-tauri/src/commands/generate.rs`    | `invoke("generate")`                                  |
| `src-tauri/src/commands/settings.rs`    | `load_settings`, `save_settings`                      |
| `src-tauri/src/commands/models.rs`      | `list_ollama_models`, `check_ollama_status`           |
| `src-tauri/src/commands/gguf.rs`        | HuggingFace download, model listing                   |
| `src-tauri/src/commands/run_llama.rs`   | `run_gguf` (feature `gguf`)                           |

### Config

| File                        | Purpose                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`  | Ubuntu 24.04 build, `TAURI_FEATURES=gguf`                                 |
| `src-tauri/Cargo.toml`      | Rust deps, `gguf` feature gate                                            |
| `src-tauri/tauri.conf.json` | Window size 1100×750, product name                                        |
| `package.json`              | Scripts: dev, build, lint, typecheck, tauri-build                         |
| `vite.config.ts`            | Proxy: `/api/ollama` → localhost:11434, `/api/openrouter` → openrouter.ai |

---

## Design System

| Theme  | Primary   | Background | Notes   |
| ------ | --------- | ---------- | ------- |
| Golden | `#E7B33B` | `#F8F4EE`  | Default |
| Sage   | `#6B8E23` | `#F0F4EC`  |         |
| Pastel | `#E879A0` | `#FDF2F6`  |         |
| Ocean  | `#3B82F6` | `#EFF6FF`  |         |

---

## How to Start a New Conversation

1. Read this file (`PROGRESS.md`) from the project root
2. Paste its contents into the new conversation
3. I'll have full context of where we are, what's done, what's next
4. Continue from the "Next Steps" section below

---

## Next Steps

**Immediately next:** Implement Phase 3 — tool calling engine

- Create `src-tauri/src/commands/tools.rs` with tool registry
- Add `<CALL>` JSON block parser in Rust
- Create `src/lib/tools.ts` in frontend
- Integrate tool parsing into `App.tsx` streaming loop
- Run `npm run lint && npm run typecheck && npm run build && cargo check`
- Commit and push

**After Phase 3:** Phase 4 — Full skill import (extract from SKILL.md files)

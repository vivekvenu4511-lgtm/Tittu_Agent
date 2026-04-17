# Feature Improvement Plan – Tittu Agent (BrainAgent OS parity)

> Goal: Align Tittu Agent with BrainAgent OS in UI, skill system, agent handling, RAG, self-evolution, mobile SDK, and CI while respecting:
>
> - Windows + macOS support
> - OpenRouter as default provider (user supplies key at first run)
> - Master-password policy (≥8 chars, upper/lower/digit)
> - Google Drive sync (read/write)
> - Full Graphify UI (PNG/SVG/JSON export)
> - MCP hybrid routing (local GGUF → OpenRouter fallback)
> - Plugin store on GitHub Pages + local plugins/ folder

---

## Phase 0 – Foundations (Read-Only Planning)

- First-run wizard: OpenRouter key validation and storage in OS keyring.
- Master-password prompt with bcrypt verification stored in keyring.
- Verify tauri.conf.json includes Windows + macOS targets.

---

## Phase 1 – Provider & Model Layer

- OpenRouter default provider with dynamic model list via Tauri command `list_openrouter_models`.
- Local GGUF downloads for Gemma 4E4B / 2E2B into src-tauri/models/.
- GPU detection (Windows dxdiag, macOS system_profiler) and runtime flag to enable GPU layers in `run_llama`.
- Performance budget: ≤3s for ≤300 tokens; fallback to CPU with toast if exceeded.
- Google Drive OAuth2 (scope: drive.file) with encrypted token storage.

---

## Phase 2 – UI – Radix 12-Tab Layout

- Install Radix UI components: tabs, dialog, select, switch, dropdown-menu.
- Refactor App.tsx with `<Tabs.Root>` and 12 triggers matching BrainAgent OS.
- Apply existing Tailwind theme variables to Radix components.
- Implement responsive collapse into a vertical drawer on narrow screens.
- Add global floating agent triggered by Ctrl/Cmd+Space.

---

## Phase 3 – Skill Import & Registry

- Node script: scripts/extract-skills.ts to walk Skills/antigravity-awesome-skills-main, parse SKILL.md and AGENTS.md, emit src/skills/registry.ts.
- Tauri commands: list_skills, list_agents.
- Watch mode during dev; postinstall script runs extractor.

---

## Phase 4 – Skills Manager UI

- SkillsManager.tsx in the Skills tab:
  - Bundles accordion with per-skill toggles.
  - Quick Add to enable all skills in a bundle.
  - Manual add via JSON definition form.
  - Import/Export JSON.
- Persist enabled flags in localStorage via store.ts; filter registry before exposing to backend.
- Search box to filter skills.

---

## Phase 5 – Tool-Calling Engine (Multi-Call & Dispatcher)

- Refactor backend parser to return Vec<Call> and iterate sequentially.
- Generic dispatcher built from enabled skill registry.
- Frontend: per `<CALL>` loading toast; replace with collapsible ToolResult card.
- Clear error toasts for unknown skills or malformed JSON.

---

## Phase 6 – Graphify Knowledge-Graph UI

- GraphView.tsx using Vis-Network (or D3-Force).
- Toolbar: Zoom, Fit, Filter by node type, Export PNG/SVG/JSON.
- Node click popup metadata; double-click to edit label → dispatch graphify_update_node skill.
- Auto-open Graph view on `<CALL>{"name":"graphify"}</CALL>` response.

---

## Phase 7 – Agent Loading & Selector

- Parse AGENTS.md into agent descriptors { id, name, role, systemPrompt, providerConfig }.
- AgentSelector in chat header or dedicated Agents tab.
- Persist selected agentId; include systemPrompt and providerConfig in backend generation call.

---

## Phase 8 – Floating Agent & System Context

- Global hotkey: Ctrl/Cmd+Space via tauri-plugin-global-shortcut.
- Foreground context command (WinAPI / NSWorkspace / X11) to include current app and selected text.
- Inject context into LLM system prompt.
- Transparent, always-on-top overlay styled with Tailwind; responsive collapse.

---

## Phase 9 – Local GGUF + GPU

- One-click downloader for GGUF files into src-tauri/models/.
- GPU detection -> enable n_gpu_layers; CPU fallback with warning toast.
- Latency benchmark to enforce ≤3s budget; auto-throttle threads if needed.

---

## Phase 10 – Office Automation

- Windows: COM wrappers for Excel, Outlook, Word via windows crate.
- macOS: AppleScript via osascript.
- Skills: applyExcelFormula, createOutlookMeeting, injectWordText.
- UI in Skills tab for file picker and parameter inputs; toast feedback.

---

## Phase 11 – Knowledge Base, Vector Search & RAG

- SQLite storage; embeddings via OpenRouter/Gemini; Tantivy vector index.
- Drag-and-drop upload for PDF, PPTX, DOCX, XLSX, images, ZIP, video, audio.
- Google Drive sync with encrypted blob upload (AES-GCM derived from master password); last-write-wins merge.
- RAG: top-k snippets prepended to system prompt before LLM call.
- Target: <500ms for embedding + vector search.

---

## Phase 12 – Vibe Code IDE (3-Pane)

- Layout: grid-cols-[200px_1fr_300px] with File Explorer, Monaco editor, Vibe Chat/Planner.
- File Explorer via Tauri filesystem APIs.
- Terminal via xterm.js + Tauri shell command.
- Insert generated code button on `<FILE_GEN>` blocks.
- Responsive drawer collapse on small screens.

---

## Phase 13 – Background Research Agents

- Workers via tauri::async_runtime::spawn; state in Arc<Mutex<AgentState>>.
- Commands: start/pause/resume/cancel/get_progress.
- Persist agent state to SQLite; auto-resume paused agents.
- PDF report generation via jsPDF (frontend) or printpdf (backend).

---

## Phase 14 – Self-Evolution & Secure Upgrades

- Release checker via GitHub Releases API.
- Create encrypted backups (zip) in ./backups/.
- Master-password gate (≥8, complexity) before upgrade.
- Replace binary, relaunch, and optionally upload backup to Google Drive.
- UI: check for updates, restore backups, export installer.

---

## Phase 15 – MCP (Multi-Channel Provider) Engine

- Trait McpProvider with stream of chunks.
- Hybrid provider: local GGUF stream -> fallback to OpenRouter.
- Simple dropdown: Local→OpenRouter fallback, OpenRouter only, Local only.
- Backend wiring to use selected MCP mode.

---

## Phase 16 – Mobile SDK Scaffold

- Create brain_lib crate with provider/skill/knowledge abstractions; expose C FFI.
- React Native/Expo project with native module linking to brain_lib.
- Minimal UI: Hello Agent screen, Settings (model/provider, Drive sync, master password).
- Sync via same encrypted Google Drive blob (last-write-wins).

---

## Phase 17 – QA, Performance & Packaging

- Unit tests (Vitest) for provider, skill registry, GPU detection, Drive sync, Graphify.
- E2E tests (Playwright): IDE → Graphify → edit → export PNG; GGUF inference <3s.
- Benchmarks (criterion); Performance tab for thread/GPU tuning.
- Tauri build -> unsigned installers; store in ./backups/.
- Optional code signing when certificates provided.

---

## Phase 18 – CI Automation

- GitHub Actions workflow:
  1. lint
  2. test:unit
  3. test:e2e
  4. build:desktop
  5. build:mobile
  6. upload-artifacts
- Cache node_modules, Cargo registry, build targets.
- Conditional signing when secrets present.

---

## Open Questions

1. Agent metadata parsing format in AGENTS.md.
2. Graphify update persistence (local vs knowledge base).
3. Default theme (Cloud vs Night).
4. Plugin manifest fields beyond basics.
5. MCP fallback behavior (continue vs restart).

Note: This plan will be executed in phases. The companion Improvement_progress.md should be updated as phases complete.

# Tittu Agent — Improvement Progress

## Improvement Roadmap

> Last updated: 2026-04-17
> Feature Improvement Plan: Feature_Improvement_Plan.md

| Phase | Goal                                  | Status     | Notes                                               |
| ----- | ------------------------------------- | ---------- | --------------------------------------------------- |
| 0     | Foundations (wizard, master-password) | ✅ Done    | First-run wizard with API key + password validation |
| 1     | Provider & Model Layer                | ✅ Done    | OpenRouter default, model selector updated          |
| 2     | Radix UI + 12-tab layout              | ✅ Done    | Installed Radix UI, created TabLayout component     |
| 3     | Skill import pipeline                 | ✅ Done    | 2949 skills + 72 agents extracted                   |
| 4     | Skills Manager UI                     | ✅ Done    | Created SkillsManager component with enable/disable |
| 5     | Multi-call tool engine                | ✅ Done    | Parser + dispatcher + UI feedback                   |
| 6     | Graphify Knowledge-Graph UI           | ✅ Done    | Created GraphView component with export features    |
| 7     | Agent selector                        | ✅ Done    | Created AgentSelector component                     |
| 8     | Floating agent & context              | ✅ Done    | Ctrl+Space hotkey, floating chat window             |
| 9     | Local GGUF + GPU                      | ⬜ Pending | One-click GGUF, GPU detection, latency target       |
| 10    | Office automation                     | ⬜ Pending | COM/AppleScript, Excel/Outlook/Word skills          |
| 11    | Knowledge base + RAG                  | ✅ Done    | Drag-drop upload, Google Drive sync UI              |
| 12    | Vibe Code IDE                         | ✅ Done    | 3-pane layout with Monaco, file explorer, terminal  |
| 13    | Background research agents            | ⬜ Pending | Workers, PDF report generation                      |
| 14    | Self-evolution & upgrades             | ⬜ Pending | Release checker, backup/restore, password gate      |
| 15    | MCP engine                            | ⬜ Pending | Hybrid provider, fallback dropdown                  |
| 16    | Mobile SDK scaffold                   | ⬜ Pending | brain_lib crate, Expo project                       |
| 17    | QA / Performance / Packaging          | ⬜ Pending | Vitest, Playwright, benchmarks, unsigned installers |
| 18    | CI Automation                         | ⬜ Pending | GitHub Actions workflow                             |

---

## What Happens Next

1. **Phase 0** – Implement first-run wizard and master-password policy.
2. **Phase 1** – Wire up OpenRouter as default provider, add GGUF downloads, GPU detection.
3. **Phase 2** – Install Radix UI and create the 12-tab layout matching BrainAgent OS.
4. **Phase 3‑4** – Build the skill extraction pipeline and Skills Manager UI.
5. **Phase 5‑7** – Tool calling engine, Graphify UI, and agent selector.
6. **Phase 8‑9** – Floating agent and local GGUF support.
7. **Phase 10‑12** – Office automation, Knowledge base, IDE.
8. **Phase 13‑15** – Research agents, self-upgrade, MCP engine.
9. **Phase 16‑18** – Mobile SDK, QA, and CI.

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Run the app in dev mode
npm run tauri-dev

# Run tests
npm run test        # unit tests
npm run test:e2e    # e2e tests

# Build for production
npm run tauri-build
```

---

## Key Files Reference

### Feature Implementation

| File                               | Purpose                     |
| ---------------------------------- | --------------------------- |
| `Feature_Improvement_Plan.md`      | Full implementation plan    |
| `Improvement_progress.md`          | This file – tracks progress |
| `src/skills/registry.ts`           | Generated skill registry    |
| `src/components/SkillsManager.tsx` | Skills UI                   |
| `src/components/GraphView.tsx`     | Graphify knowledge graph    |
| `src/components/AgentSelector.tsx` | Agent selector              |
| `src/components/IDELayout.tsx`     | Vibe Code 3-pane IDE        |
| `src/lib/api.ts`                   | API calls to Tauri backend  |

### Backend (Rust)

| File                                    | Purpose              |
| --------------------------------------- | -------------------- |
| `src-tauri/src/commands/skills.rs`      | Skill commands       |
| `src-tauri/src/commands/agents.rs`      | Agent commands       |
| `src-tauri/src/providers/gguf.rs`       | Local GGUF inference |
| `src-tauri/src/providers/openrouter.rs` | OpenRouter provider  |
| `src-tauri/src/hw.rs`                   | GPU detection        |

---

## Design System

The app uses Tailwind CSS v4 with custom themes:

| Theme  | Primary | Background |
| ------ | ------- | ---------- |
| Golden | #E7B33B | #F8F4EE    |
| Sage   | #6B8E23 | #F0F4EC    |
| Pastel | #E879A0 | #FDF2F6    |
| Ocean  | #3B82F6 | #EFF6FF    |
| Cloud  | #6366F1 | #F3F4F6    |
| Night  | #1E293B | #0F172A    |

---

## How to Update This File

After completing a phase:

1. Change the **Status** column from `⬜ Pending` to `✅ Done`.
2. Add a brief note in the **Notes** column describing what was implemented.
3. Commit with a message like `feat(phase<N>): <description>`.

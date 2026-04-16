# Tittu Agent Software

A cross-platform desktop AI agent application built with **Tauri 2**, **React 18**, **Vite**, and **Tailwind CSS v4**.

## Tech Stack

| Layer           | Technology                    |
| --------------- | ----------------------------- |
| Desktop shell   | [Tauri 2](https://tauri.app/) |
| Frontend        | React 18 + TypeScript         |
| Build tool      | Vite 5                        |
| Styling         | Tailwind CSS v4 + PostCSS     |
| Desktop bundler | Tauri CLI                     |

## Prerequisites

| OS             | Requirements                                                    |
| -------------- | --------------------------------------------------------------- |
| **Linux (CI)** | Ubuntu 24.04, Rust stable, Node.js 20                           |
| **macOS**      | Xcode CLI tools, Rust, Node.js 20                               |
| **Windows**    | Visual Studio 2022 Build Tools (C++ workload), Rust, Node.js 20 |

### Linux native dependencies (for Tauri)

```bash
sudo apt-get update
sudo apt-get install -y \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libwebkit2gtk-4.1-dev \
  patchelf
```

## Setup

```bash
# Install Rust (Linux/macOS/Windows)
curl https://sh.rustup.rs -sSf | sh -s -- -y
source $HOME/.cargo/env

# Install Node dependencies
npm ci

# Install TypeScript types (React)
npm install -D @types/react @types/react-dom
```

## Development

```bash
# Run the Vite dev server
npm run dev

# Run in Tauri dev mode (opens desktop window)
npm run tauri-dev
```

## Build

```bash
# Build frontend only (outputs to dist/)
npm run build

# Build full Tauri desktop app (outputs to src-tauri/target/)
npm run tauri-build
```

## Quality Checks

```bash
# ESLint (React + TypeScript)
npm run lint

# TypeScript type checking
npm run typecheck
```

## Project Structure

```
.
├── src/                    # React frontend source
│   ├── App.tsx             # Main UI component
│   ├── main.tsx            # React entry point
│   └── index.css           # Tailwind + CSS variables
├── src-tauri/              # Tauri desktop shell (Rust)
│   ├── tauri.conf.json     # Tauri configuration
│   ├── src/                # Rust source
│   └── Cargo.toml
├── dist/                   # Built frontend (generated)
├── .github/workflows/      # GitHub Actions CI
│   └── ci.yml
├── package.json
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
└── tailwind.config.cjs
```

## CI Pipeline

Every push and pull request automatically runs:

1. `npm ci` — install dependencies
2. `npm run lint` — ESLint check
3. `npm run typecheck` — TypeScript type check
4. `npm run build` — Vite frontend build
5. Rust toolchain install (via `actions-rs/toolchain`)
6. Linux native dependencies for Tauri
7. `npm run tauri-build` — desktop binary

## Version

v0.1.0 — initial release

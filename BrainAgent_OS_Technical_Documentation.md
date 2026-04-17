# 🧠 BrainAgent OS Enhanced v3.0 — Complete Technical Documentation

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Core Features](#3-core-features)
4. [AI Integration](#4-ai-integration)
5. [File Generation System](#5-file-generation-system)
6. [Antigravity Awesome Skills Integration](#6-antigravity-awesome-skills-integration)
7. [UI/UX Features](#7-uiux-features)
8. [Data Management](#8-data-management)
9. [Security & Configuration](#9-security--configuration)

---

## 1. Architecture Overview

```
brainagent-os-enhanced/
├── src/
│   ├── App.tsx                    # Main orchestrator - tabs, routing, state
│   ├── main.tsx                   # Entry point
│   ├── components/
│   │   ├── Chat.tsx               # AI chat interface with file generation
│   │   ├── Settings.tsx           # API keys, theme, provider config
│   │   ├── AgentManager.tsx       # Multi-agent management
│   │   ├── SkillsManager.tsx      # Custom skills + Antigravity bundles
│   │   ├── KnowledgeBase.tsx      # Document storage/retrieval
│   │   ├── TaskManager.tsx        # Task assignment & scheduling
│   │   ├── ResearchManager.tsx    # Background AI agents
│   │   ├── ProjectManager.tsx     # Workspace management
│   │   ├── ArtifactsView.tsx       # Generated code artifacts
│   │   ├── ExtensionsView.tsx      # Plugin marketplace
│   │   ├── ConnectorsView.tsx      # Third-party integrations
│   │   ├── VibeCodeView.tsx       # AI coding environment
│   │   └── ui/                    # Reusable UI components (Radix-based)
│   ├── services/
│   │   ├── aiService.ts           # Multi-provider AI abstraction
│   │   └── fileGeneratorService.ts # Real PPT/PDF/Excel/Word/ZIP generator
│   └── lib/
│       ├── firebase.ts            # Firebase auth & Firestore
│       └── utils.ts               # Utility functions (cn, tailwind-merge)
├── .env                           # Environment variables (API keys)
├── vite.config.ts                 # Build configuration with aliases
└── package.json                   # Dependencies
```

### Design Patterns
- **Component-Based Architecture**: React functional components with hooks (useState, useEffect, useRef)
- **State Management**: React useState/useContext for local state, Firebase Firestore for persistence
- **Service Layer**: Separation of AI logic and file generation into dedicated services
- **Provider Pattern**: Multi-AI provider abstraction (Gemini, OpenRouter, HuggingFace, Ollama, LM Studio)

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| Vite | 5.4.8 | Build tool & dev server |
| Tailwind CSS | 4.1.4 | Styling with @tailwindcss/vite |
| TypeScript | 5.6.2 | Type safety throughout |
| Lucide React | 0.446.0 | Icon library |
| Radix UI | Various | Accessible UI components (Dialog, Select, Tabs, Switch, etc.) |
| Sonner | 1.5.0 | Toast notifications |
| React Markdown | 9.0.1 | Markdown rendering in chat |
| React Syntax Highlighter | 15.5.13 | Code block syntax highlighting |

### AI & APIs
| Technology | Purpose |
|------------|---------|
| @google/genai | Gemini API integration |
| Firebase 10.14.0 | Authentication & Firestore database |
| OpenAI API | DALL-E 3 image generation |

### File Generation Libraries
| Library | Version | Files Generated |
|---------|---------|-----------------|
| pptxgenjs | 3.12.0 | PowerPoint (.pptx) |
| docx | 8.5.0 | Word (.docx) |
| xlsx | 0.18.5 | Excel (.xlsx) |
| jspdf | 2.5.1 | PDF documents |
| jszip | 3.10.1 | ZIP archives |

---

## 3. Core Features

### 3.1 Multi-Provider AI Integration
The system supports 5 different AI providers with 8+ models:

| Provider | Model Examples | Context Window | Best For |
|----------|---------------|----------------|----------|
| **Google Gemini** | gemini-2.0-flash, gemini-2.5-pro, flash-thinking | 1M tokens | Default, free tier, fast |
| **OpenRouter** | GPT-4o, Claude 3.5 Sonnet, DeepSeek R1 | 128K-200K | Multi-model access |
| **HuggingFace** | Mistral 7B | 8K | Community models |
| **Local (Ollama)** | Llama 3 | 8K | 100% offline, privacy |
| **LM Studio** | Various local models | Varies | Local with GUI |

### 3.2 Agent System
- **Multiple Agents**: Create unlimited specialized AI agents
- **Built-in Agents**:
  - Primary Brain (General Assistant)
  - Code Brain (Expert Developer)
  - Analyst Brain (Data Analyst & Researcher)
- **Mode Selection**: 
  - 💬 Chat - Conversational mode
  - ⚡ Vibe Code - Creative exploration, rapid prototyping
  - 📋 Planning - Structured thinking, roadmaps
  - 🤝 Cowork - Collaborative partner

### 3.3 Conversation Management
- Multiple concurrent conversations with tabs
- Real-time message updates
- Conversation export to ZIP (chat history + README)
- Chat history persistence via Firebase
- Regenerate last response functionality
- Message rating (thumbs up/down)

---

## 4. AI Integration

### chatWithBrain() Function
**Location**: `src/services/aiService.ts:282-459`

**Function Signature**:
```typescript
async function chatWithBrain(
  messages: Message[],
  knowledge: KnowledgeItem[],
  config: ProviderConfig,
  skills: Skill[] = [],
  mode: AgentMode = "chat",
  useIntelligence: boolean = false,
  agentRole?: string
): Promise<string>
```

**Parameters**:
- `messages`: Chat history with role (user/model), text, timestamp
- `knowledge`: Context documents from Knowledge Base
- `config`: Provider configuration (provider, apiKey, baseUrl, modelId)
- `skills`: Array of function declarations for tool use
- `mode`: Agent mode (chat/vibe/planning/cowork)
- `useIntelligence`: Autonomy toggle - enables full tool selection
- `agentRole`: Agent specialization for context

**System Prompt Features**:
- File generation instructions with structured JSON output format
- Mode-specific behavior instructions
- Knowledge base context injection
- Skill/function declarations for custom tools
- Intelligence mode for autonomous tool selection

### generateImageWithAI()
**Location**: `src/services/aiService.ts:463-491`

Creates images using DALL-E 3 via OpenAI API.

---

## 5. File Generation System

### How It Works
1. AI responds with `<FILE_GEN>` JSON block containing file specifications
2. `extractFileGenPayload()` parses the JSON from response text
3. `generateFile()` dispatches to appropriate generator based on type
4. Browser initiates native file download

### Supported File Types

| Type | Extension | Generator Library | Features |
|------|-----------|-------------------|----------|
| **Presentation** | `.pptx` | pptxgenjs | Title slide, content slides, bullets, speaker notes, branded styling |
| **PDF** | `.pdf` | jsPDF | Headers, sections, page numbers, footer, styled text |
| **Excel** | `.xlsx` | xlsx | Multi-sheet support, styled headers, auto-column width |
| **Word** | `.docx` | docx | Headings (H1-H3), paragraphs, borders, centered title |
| **Archive** | `.zip` | jszip | Multiple files, folder structure, metadata JSON |
| **CSV** | `.csv` | Native JS | Tabular data with quoted fields |
| **Text/Markdown** | `.txt/.md` | Native JS | Plain text or markdown content |

### AI File Generation Prompts
The AI is instructed via system prompts to generate files when users request:
- "Create a presentation about X" → Generates PPTX
- "Generate a report on Y" → Generates PDF
- "Create a spreadsheet for Z" → Generates XLSX
- "Write a document about W" → Generates DOCX
- "Package this as ZIP" → Generates ZIP archive

### File Payload Structure
```json
{
  "type": "ppt|pdf|excel|word|zip|csv|text",
  "filename": "descriptive-filename.ext",
  "title": "Human-readable title",
  "slides": [{ "title": "...", "content": ["..."], "notes": "..." }],
  "sections": [{ "heading": "...", "text": "...", "level": 1 }],
  "sheets": [{ "name": "...", "headers": [...], "rows": [...] }],
  "files": [{ "name": "...", "content": "..." }],
  "headers": [...],
  "rows": [[...]],
  "content": "..."
}
```

---

## 6. Antigravity Awesome Skills Integration

### Overview
BrainAgent OS Enhanced integrates **pre-built skill bundles** from Antigravity Awesome Skills - a collection of 1,409+ reusable SKILL.md playbooks for AI coding assistants.

### Integration Method
Skills are implemented as **function declarations** (JSON) that the AI can use as tools. When a skill is enabled, the AI receives the function definition and can call it during conversations.

### Available Skill Bundles (6 bundles, 18 skills total)

#### 1. 🌐 Web Wizard Bundle
**Category**: Development  
**Purpose**: Frontend development skills for React, Vue, CSS, and modern web

| Skill Name | Description | Function Definition |
|------------|-------------|---------------------|
| React Best Practices | React component patterns and hooks | `{"name": "reactBestPractices", "description": "Get React best practices and patterns", "parameters": {"type": "object", "properties": {}}}` |
| CSS Grid Layout | Create responsive grid layouts | `{"name": "cssGridLayout", "description": "Generate CSS grid layouts", "parameters": {"type": "object", "properties": {}}}` |
| Tailwind Setup | Configure Tailwind CSS | `{"name": "tailwindSetup", "description": "Setup Tailwind CSS configuration", "parameters": {"type": "object", "properties": {}}}` |

#### 2. 🔒 Security Engineer Bundle
**Category**: Security  
**Purpose**: Security auditing, vulnerability scanning, and secure coding

| Skill Name | Description | Function Definition |
|------------|-------------|---------------------|
| Security Audit | Perform security code audit | `{"name": "securityAudit", "description": "Audit code for security vulnerabilities", "parameters": {"type": "object", "properties": {}}}` |
| OWASP Checklist | OWASP top 10 vulnerability checks | `{"name": "owaspCheck", "description": "Check for OWASP vulnerabilities", "parameters": {"type": "object", "properties": {}}}` |
| Pen Test Report | Generate penetration test report | `{"name": "penTestReport", "description": "Generate pen test report", "parameters": {"type": "object", "properties": {}}}` |

#### 3. 🧪 QA & Testing Bundle
**Category**: Testing  
**Purpose**: Testing skills for unit tests, integration tests, and E2E

| Skill Name | Description | Function Definition |
|------------|-------------|---------------------|
| Unit Test Generator | Generate Jest/Vitest unit tests | `{"name": "generateUnitTests", "description": "Generate unit tests for code", "parameters": {"type": "object", "properties": {}}}` |
| E2E Test Setup | Setup Playwright/Cypress tests | `{"name": "setupE2E", "description": "Setup end-to-end testing", "parameters": {"type": "object", "properties": {}}}` |
| Mock Data Generator | Create mock data for testing | `{"name": "generateMockData", "description": "Generate mock test data", "parameters": {"type": "object", "properties": {}}}` |

#### 4. ☁️ DevOps & Cloud Bundle
**Category**: DevOps  
**Purpose**: Docker, Kubernetes, AWS, CI/CD pipeline skills

| Skill Name | Description | Function Definition |
|------------|-------------|---------------------|
| Dockerfile Generator | Create optimized Dockerfiles | `{"name": "generateDockerfile", "description": "Generate Dockerfile", "parameters": {"type": "object", "properties": {}}}` |
| K8s Manifest | Generate Kubernetes manifests | `{"name": "generateK8sManifest", "description": "Generate K8s manifest", "parameters": {"type": "object", "properties": {}}}` |
| GitHub Actions | Create CI/CD workflows | `{"name": "generateGitHubAction", "description": "Generate GitHub Actions workflow", "parameters": {"type": "object", "properties": {}}}` |

#### 5. 🔗 API Designer Bundle
**Category**: Backend  
**Purpose**: REST, GraphQL API design and documentation skills

| Skill Name | Description | Function Definition |
|------------|-------------|---------------------|
| REST API Design | Design RESTful APIs | `{"name": "designRestApi", "description": "Design REST API", "parameters": {"type": "object", "properties": {}}}` |
| GraphQL Schema | Create GraphQL schemas | `{"name": "generateGraphQLSchema", "description": "Generate GraphQL schema", "parameters": {"type": "object", "properties": {}}}` |
| API Documentation | Generate API docs | `{"name": "generateApiDocs", "description": "Generate API documentation", "parameters": {"type": "object", "properties": {}}}` |

#### 6. 📊 Data Engineer Bundle
**Category**: Data  
**Purpose**: SQL, data pipelines, ETL, and database skills

| Skill Name | Description | Function Definition |
|------------|-------------|---------------------|
| SQL Query Optimizer | Optimize SQL queries | `{"name": "optimizeSql", "description": "Optimize SQL query", "parameters": {"type": "object", "properties": {}}}` |
| Schema Designer | Design database schemas | `{"name": "designSchema", "description": "Design database schema", "parameters": {"type": "object", "properties": {}}}` |
| ETL Pipeline | Create ETL pipeline code | `{"name": "generateETL", "description": "Generate ETL pipeline", "parameters": {"type": "object", "properties": {}}}` |

### Skill Categories
| Category | Icon | Description |
|----------|------|-------------|
| All | 📦 | View all skills |
| Development | 💻 | Frontend & full-stack |
| Security | 🔒 | Auditing & vulnerabilities |
| Testing | 🧪 | Unit, integration, E2E |
| DevOps | ☁️ | CI/CD, containers, cloud |
| Backend | ⌨️ | APIs & servers |
| Data | 📊 | Databases & pipelines |

### How to Use Skills

1. **Quick Add**: Click "Quick Add" button → Browse skill bundles → Select bundle → Install all skills
2. **Manual Add**: Fill in skill name, description, and JSON function definition
3. **Import**: Import skills from JSON file
4. **Export**: Export all skills to JSON for backup/sharing

### Skill Integration in Chat
When skills are enabled, they are passed to the AI as function declarations in the `tools` parameter. The AI can then use these tools during conversations based on user requests.

---

## 7. UI/UX Features

### 7.1 Theme System
5 built-in themes with CSS custom properties:

| Theme | Name | Colors | Best For |
|-------|------|--------|----------|
| ☀️ | Cloud | White + violet | Professional work |
| 🌙 | Night | Dark + purple | Late night sessions |
| 🌸 | Pastel | Pink/lavender | Creative work |
| ⭐ | Golden | Amber/yellow | Energetic focus |
| 🍃 | Sage | Mint/green | Calm productivity |

Theme switching is instant with CSS classes - no page reload required.

### 7.2 Tab Navigation (12 Sections)
1. **Workspace** - Chat interface with message history
2. **Projects** - Workspace/folder management
3. **Vibe Code** - AI-powered coding environment
4. **Research** - Background AI agents with progress tracking
5. **Artifacts** - Generated code/apps gallery
6. **Tasks** - Task matrix with agent assignment
7. **Extensions** - Plugin marketplace
8. **Connectors** - Third-party integrations
9. **Skills** - Custom + Antigravity skill bundles
10. **Knowledge** - Document storage & retrieval
11. **Guide** - Usage documentation & tutorials
12. **Config** - Settings & API configuration

### 7.3 Chat Interface Features
- **Quick Action Buttons**: One-click shortcuts for file generation
  - 📊 Generate PPT
  - 📄 Generate PDF
  - 📗 Generate Excel
  - 📝 Generate Word
  - 🖼️ Generate Image
  - 📦 Generate ZIP
  - 📋 Summarize
  - 🔍 Compare Files
  - 💡 Brainstorm
  - 🧠 Deep Analysis

- **Message Actions**: Copy, regenerate, thumbs up/down
- **File Attachments**: Drag & drop or click to attach
- **Model Selector**: Switch between AI models
- **Agent Selector**: Switch between configured agents
- **Mode Selector**: Chat / Vibe Code / Planning / Cowork
- **Intelligence Toggle**: Enable autonomous tool selection
- **Typing Indicator**: Visual feedback during AI response
- **Auto-scroll**: Automatically scroll to new messages

### 7.4 Component Library (Radix UI Based)
- Button, Input, Textarea
- Card, Badge, Label
- Tabs, Select, Switch
- Dialog (Modal), ScrollArea
- Progress indicator

---

## 8. Data Management

### Firebase Integration
- **Authentication**: Google Sign-In via Firebase Auth
- **Database**: Firestore for real-time cloud sync
- **Collections**: 
  - `knowledge` - Document storage
  - `skills` - Custom skill definitions
  - `agents` - Agent configurations
  - `conversations` - Chat history
  - `tasks` - Task management

### Local Storage
- Settings persistence (app name, theme)
- Config persistence (provider, model, base URL)
- No login required for local-only usage

### Data Models (TypeScript Interfaces)

```typescript
interface KnowledgeItem {
  id: string;
  fileName: string;
  content: string;
  userId: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  definition: string; // JSON function declaration
  userId: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  providerConfig: ProviderConfig;
  userId: string;
  mode: AgentMode;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  userId: string;
  agentId: string;
  updatedAt: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "scheduled";
  assignedAgentId: string;
  scheduledAt?: number;
  userId: string;
}

interface ProviderConfig {
  provider: Provider;
  apiKey?: string;
  baseUrl?: string;
  modelId?: string;
}

type Provider = "gemini" | "local" | "huggingface" | "openrouter" | "lmstudio";
type AgentMode = "chat" | "vibe" | "planning" | "cowork";
```

---

## 9. Security & Configuration

### Environment Variables (.env)
```env
# Google AI (Free tier available)
VITE_GEMINI_API_KEY=your_gemini_key

# OpenAI (For DALL-E 3 image generation)
VITE_OPENAI_API_KEY=your_openai_key

# OpenRouter (Access GPT-4o, Claude, DeepSeek)
VITE_OPENROUTER_API_KEY=your_openrouter_key

# HuggingFace (Community models)
VITE_HF_API_KEY=your_huggingface_token

# Firebase (Optional - enables cloud sync)
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id

# Local Models
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_LM_STUDIO_URL=http://localhost:1234
```

### Security Features
- API keys stored in `.env` (never committed to version control)
- Vibe Mode password protection for sensitive operations
- Firebase sync is optional - works fully offline
- Direct-to-AI-provider calls (no proxy server)
- CORS configured for local development

### Vite Configuration Highlights
```typescript
// Path alias for clean imports
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}

// Code splitting for optimized bundles
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-ai': ['@google/genai'],
        'vendor-office': ['pptxgenjs', 'docx', 'xlsx', 'jspdf'],
        'vendor-ui': ['lucide-react', 'sonner'],
      },
    },
  },
}
```

---

## Summary Table

| Feature | Status | Implementation Location |
|---------|--------|------------------------|
| Multi-provider AI | ✅ | `src/services/aiService.ts` |
| Real file generation (PPT/PDF/Excel/Word/ZIP) | ✅ | `src/services/fileGeneratorService.ts` |
| Firebase sync (Auth + Firestore) | ✅ | `src/lib/firebase.ts` |
| Theme system (5 themes) | ✅ | `src/App.tsx` CSS variables |
| Multi-agent management | ✅ | `src/components/AgentManager.tsx` |
| **Antigravity Skills (6 bundles, 18 skills)** | ✅ | `src/components/SkillsManager.tsx` |
| Task management | ✅ | `src/components/TaskManager.tsx` |
| Research agents | ✅ | `src/components/ResearchManager.tsx` |
| Extensions marketplace | ✅ | `src/components/ExtensionsView.tsx` |
| Knowledge base | ✅ | `src/components/KnowledgeBase.tsx` |
| PWA support | ✅ | `public/manifest.json` |
| TypeScript throughout | ✅ | All `.ts` and `.tsx` files |

---

## How to Explain to Others

When presenting BrainAgent OS Enhanced to technical audiences, emphasize:

1. **"It's like Claude + ChatGPT combined, but with real file output"** - The AI can generate actual downloadable files, not just text.

2. **"Runs entirely locally if needed"** - Using Ollama or LM Studio, no internet required after initial setup.

3. **"Extensible skill system"** - The Antigravity integration provides 18 pre-built skills across 6 categories (Development, Security, Testing, DevOps, Backend, Data).

4. **"Multi-model flexibility"** - Switch between Gemini (free), GPT-4o, Claude, DeepSeek, or local models seamlessly.

5. **"Open architecture"** - Built on React, Vite, Tailwind - easy to extend and customize.

---

*Documentation generated for BrainAgent OS Enhanced v3.0*  
*Total Skills: 18 (6 bundles from Antigravity Awesome Skills)*  
*Total Features: 100+ across 12 main sections*
# AGENT.md — Openman Development Guide

## Tech Stack Versions

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.7.3 | Type-safe JavaScript |
| Vite | 6.0.7 | Build tool / dev server |
| Zustand | 5.0.3 | State management |
| Tailwind CSS | 3.4.17 | Styling |
| Monaco Editor | 4.7.0 (via @monaco-editor/react) | Code/text editing |
| React Router | 7.13.2 | Navigation |
| Vitest | 4.1.2 | Unit testing |
| Playwright | 1.58.2 | E2E testing |
| ESLint | 9.18.0 | Linting |
| Storybook | 10.3.3 | Component documentation |

### Backend (Rust/Tauri)
| Technology | Version | Purpose |
|------------|---------|---------|
| Tauri | 2.x | Desktop framework |
| Rust | 2021 edition | Backend language |
| reqwest | 0.12 | HTTP client |
| tonic | 0.12 | gRPC client |
| prost | 0.13 | Protocol buffers |
| tokio | 1.x | Async runtime |
| serde | 1.x | Serialization |
| serde_json | 1.x | JSON handling |
| anyhow | 1.x | Error handling |
| thiserror | 1.x | Custom errors |
| chrono | 0.4 | Date/time |
| uuid | 1.x | ID generation |

---

## Naming Conventions

### Frontend (TypeScript/React)

#### Files
- **Components**: PascalCase — `Checkbox.tsx`, `HttpPanel.tsx`
- **Stores**: camelCase with `use` prefix — `useWorkspaceStore.ts`
- **Services**: camelCase — `httpService.ts`, `storageService.ts`
- **Types**: camelCase — `types/index.ts`
- **Tests**: `.test.tsx` or `.test.ts` suffix — `Checkbox.test.tsx`
- **Stories**: `.stories.tsx` suffix — `Checkbox.stories.tsx`

#### Components
- Functional components with named exports: `export function Checkbox({ ... })`
- Props interface: `interface CheckboxProps { ... }`
- Use `className` prop for Tailwind classes

#### State Management (Zustand)
- Store pattern: `use<Domain>Store` — `useWorkspaceStore`, `useEnvironmentStore`
- State interface: `<Domain>State` — `WorkspaceState`
- Actions as async functions in store definition

#### CSS Classes (Tailwind)
- Custom color palette: `bg-accent-orange`, `bg-elevated-bg`, `text-text-primary`
- Use semantic color names, not raw hex values

### Backend (Rust)

#### Files
- **Modules**: snake_case — `http_engine.rs`, `collection.rs`
- **Commands**: snake_case — `http.rs`, `storage.rs`

#### Structs & Enums
- PascalCase: `HttpRequest`, `HttpResponse`, `WorkspaceSettings`
- Snake_case fields (serde converts to camelCase for frontend):
  ```rust
  #[serde(rename_all = "camelCase")]
  pub struct Workspace {
      pub id: String,
      pub created_at: String,  // → createdAt in JSON
  }
  ```

#### Functions
- Snake_case: `send_request`, `format_request_error`
- Tauri commands: snake_case with `#[command]` attribute
  ```rust
  #[command]
  pub async fn send_http_request(...) -> Result<HttpResponse, String>
  ```

#### Enums
- PascalCase variants:
  ```rust
  pub enum HttpMethod { GET, POST, PUT, ... }
  pub enum RequestBody { Json { content: String }, Raw { content: String, language: String }, ... }
  ```

---

## Key Architecture Decisions

### 1. IPC Bridge Pattern
Frontend communicates with Rust backend via Tauri's `invoke` API:
```typescript
// Frontend
const response = await invoke<RustHttpResponse>("send_http_request", { request, proxy });

// Backend
#[command]
pub async fn send_http_request(request: HttpRequest, proxy_settings: Option<ProxySettings>) -> Result<HttpResponse, String>
```

### 2. Data Transformation Layer
Service files transform frontend types to backend-compatible format:
- `httpService.ts` — transforms `HttpRequest` to `RustHttpRequest`
- Variable substitution happens in service layer before sending to backend
- Response transformation back to frontend types

### 3. JSON Serialization Convention
Rust structs use `#[serde(rename_all = "camelCase")]` for frontend compatibility:
- Backend: `created_at` → Frontend: `createdAt`
- Backend: `response_time` → Frontend: `responseTime`

### 4. State Management Pattern
Zustand stores with async actions:
```typescript
interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  initialize: () => Promise<void>;
  loadWorkspaces: () => Promise<void>;
}
```

### 5. Error Handling
- **Backend**: Detailed error messages with suggestions, formatted for user display
- **Frontend**: Errors shown in response panel (body tab) with `status: 0, statusText: "Error"`
- No error banners — users need readable multi-line messages

### 6. Proxy Configuration Flow
SettingsPage → useWorkspaceStore → httpService → Rust backend
- Proxy settings stored per-workspace in `WorkspaceSettings`
- `no_proxy` bypass string supported (comma-separated domains)

### 7. History Restoration
- History items include `lastResponse` for full state restoration
- Click history → restore params, headers, body, AND response

### 8. Request Body Serialization
Frontend sends structured body:
```typescript
{ mode: "json", content: "..." }
```
Rust expects matching enum:
```rust
RequestBody::Json { content: String }
```

---

## Project Structure

```
openman/
├── src/                           # React frontend
│   ├── components/
│   │   ├── http/                  # HTTP testing components
│   │   ├── grpc/                  # gRPC testing components
│   │   ├── mcp/                   # MCP testing components
│   │   ├── common/                # Shared UI (Checkbox, Select, etc.)
│   │   └── layout/                # Sidebar, ActivityBar, MainContent
│   ├── pages/                     # Route-level pages
│   ├── stores/                    # Zustand state stores
│   ├── services/                  # Tauri IPC wrappers
│   ├── hooks/                     # Custom React hooks
│   ├── types/                     # TypeScript definitions
│   └── test/                      # Test setup/utilities
│
├── src-tauri/                     # Rust backend
│   ├── src/
│   │   ├── commands/              # Tauri IPC handlers
│   │   ├── engines/               # HTTP/gRPC/MCP engines
│   │   ├── models/                # Data structs
│   │   ├── storage/               # File storage layer
│   │   └── utils/                 # Utilities
│   └── Cargo.toml
│
├── e2e/                           # Playwright E2E tests
│   ├── fixtures/                  # Test fixtures
│   └── *.spec.ts                  # Test files
│
├── .storybook/                    # Storybook config
├── docs/                          # Documentation assets
└── plans/                         # Architecture docs
```

---

## Verification Commands

### Development
```bash
# Start dev server (Vite only)
npm run dev

# Start full Tauri app in dev mode
npm run tauri dev

# Start mock test server for API testing
npm run test:server
```

### Build
```bash
# Build frontend only
npm run build

# Build production Tauri app
npm run tauri build
```

### Linting & Type Checking
```bash
# Run ESLint (max warnings = 0)
npm run lint

# TypeScript type check (via build)
npm run build
```

### Unit Tests
```bash
# Run unit tests in watch mode
npm run test

# Run unit tests once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Run Playwright tests
npm run test:e2e

# Run with UI (debugging)
npm run test:e2e:ui

# Run headed (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

### All Tests
```bash
# Run unit + E2E tests
npm run test:all
```

### Component Documentation
```bash
# Start Storybook
npm run storybook

# Build static Storybook
npm run build-storybook
```

### CI Verification
```bash
# Check GitHub Actions status
gh run list --limit 5

# Watch current run
gh run watch

# View specific run
gh run view <run-id>
```

### Rust Checks
```bash
# Check Rust compilation
cd src-tauri && cargo check

# Run Rust tests (if any)
cd src-tauri && cargo test

# Format Rust code
cd src-tauri && cargo fmt

# Rust linter
cd src-tauri && cargo clippy
```

---

## Pre-commit Checklist

Before committing changes:

1. **Lint**: `npm run lint` — must pass with 0 warnings
2. **Type Check**: Build must compile without errors
3. **Unit Tests**: `npm run test:run` — all must pass
4. **E2E Tests**: `npm run test:e2e` — all must pass (if applicable)
5. **Rust Check**: `cargo check` in src-tauri — must compile

---

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Code style (formatting, semicolons) |
| `refactor:` | Code change without feat/fix |
| `test:` | Adding/updating tests |
| `chore:` | Maintenance, deps, configs |

Examples:
- `feat: add proxy support with no_proxy bypass`
- `fix: history restoration now includes lastResponse`
- `refactor: error handling moved to response panel`
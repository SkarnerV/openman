# AGENTS.md — Openman Development Guide

**Generated:** 2026-04-10 | **Commit:** 4c2de2f | **Branch:** main | **Purpose:** Developer reference (see [README.md](README.md) for user documentation)

---

## QUICK START

```bash
# 0. Verify prerequisites
node --version   # Should be 18+
cargo --version  # Should be latest stable

# 1. Clone and install
git clone https://github.com/skarner/openman.git && cd openman && npm install

# 2. Start development
npm run dev              # Frontend only (port 1420)
npm run tauri -- dev     # Full desktop app

# 3. Run tests
npm run test:run         # Unit tests
npm run test:e2e         # E2E tests

# 4. Build production
npm run tauri -- build
```

**First contribution?** Try this: Add a `console.log("Hello")` to `src/pages/RequestBuilder.tsx:1` and verify hot reload works. Then see [Contributing Checklist](#contributing-checklist).

---

## OVERVIEW

Openman is a modern, open-source API testing tool for HTTP, gRPC, and MCP services. Built with Tauri 2 (Rust backend) + React 18 (TypeScript frontend), providing native desktop performance with ~50MB memory footprint. Features offline-first JSON storage, Postman Collection v2.1 compatibility, and cross-platform support (macOS, Windows, Linux).

## STRUCTURE

```
openman/
├── src/                           # React frontend (TypeScript)
│   ├── main.tsx                   # React entry point
│   ├── App.tsx                    # Root component with routing, initialization
│   ├── components/
│   │   ├── common/                # Shared UI (Checkbox, Select, MonacoEditor, Modals)
│   │   │   └── stories/           # Storybook stories (*.stories.tsx)
│   │   ├── http/                  # HTTP testing components (HttpPanel)
│   │   ├── grpc/                  # gRPC testing components (GrpcPanel)
│   │   ├── mcp/                   # MCP testing components (McpPanel)
│   │   └── layout/                # ActivityBar, Sidebar, MainContent
│   ├── pages/                     # Route-level pages
│   │   ├── RequestBuilder.tsx     # HTTP request builder (params, headers, body, auth)
│   │   ├── CollectionsPage.tsx    # Collections management
│   │   ├── EnvironmentsPage.tsx   # Environment variables
│   │   ├── HistoryPage.tsx        # Request history
│   │   └── SettingsPage.tsx       # App settings (theme, editor, shortcuts)
│   ├── stores/                    # Zustand state stores (6 stores)
│   │   ├── useRequestStore.ts     # Current request, response, history
│   │   ├── useCollectionStore.ts  # Collections CRUD, drag-drop
│   │   ├── useEnvironmentStore.ts # Environment profiles, variables
│   │   ├── useWorkspaceStore.ts   # Workspace initialization
│   │   ├── useSettingsStore.ts    # UI preferences (persisted)
│   │   └── useThemeStore.ts       # Theme state (persisted)
│   ├── services/                  # Tauri IPC wrappers
│   │   ├── httpService.ts         # HTTP execution, variable substitution
│   │   ├── storageService.ts      # Workspace/collection/environment CRUD
│   │   ├── behaviorTracker.ts     # User action tracking
│   │   ├── trackerIntegration.ts  # Store integration for tracking
│   │   └── fileLogger.ts          # Log file writing
│   ├── hooks/                     # Custom hooks (useHttp, useTauri)
│   ├── types/                     # TypeScript definitions (layout.ts)
│   ├── test/                      # Test setup (Vitest mocks)
│   └── utils/                     # Utilities (curlParser)
│
├── src-tauri/                     # Rust backend
│   ├── src/
│   │   ├── main.rs                # Binary entry (delegates to lib)
│   │   ├── lib.rs                 # Tauri builder, plugin setup, command registration
│   │   ├── commands/              # IPC handlers (23 commands)
│   │   │   ├── http.rs            # send_http_request
│   │   │   ├── storage.rs         # Workspace/collection/environment CRUD
│   │   │   └── logging.rs         # User action logging
│   │   ├── engines/               # Core protocol engines
│   │   │   └── http_engine.rs     # HTTP client (reqwest, proxy, auth)
│   │   ├── models/                # Data structs (serde camelCase)
│   │   │   ├── collection.rs      # Workspace, Collection, CollectionItem
│   │   │   ├── request.rs         # HttpRequest, HttpMethod, RequestBody
│   │   │   ├── response.rs        # HttpResponse
│   │   │   └ environment.rs      # Environment variables
│   │   ├── storage/               # JSON file storage
│   │   │   ├── workspace.rs       # Workspace CRUD
│   │   │   ├── collection.rs      # Collection CRUD
│   │   │   ├── environment.rs     # Environment CRUD
│   │   │   └ logging.rs          # Daily log files
│   │   └── utils/                 # Import/export utilities
│   │       └ import_export.rs    # Postman Collection v2.1 conversion
│   ├── capabilities/              # Tauri security permissions
│   ├── icons/                     # App icons (all platforms)
│   ├── Cargo.toml                 # Rust dependencies
│   └── tauri.conf.json            # App config (window, bundle)
│
├── e2e/                           # Playwright E2E tests
│   ├── fixtures/                  # Tauri mock fixture
│   └── *.spec.ts                  # 10 test files
│
├── .storybook/                    # Storybook config
├── .github/workflows/             # CI/CD (ci.yml, release.yml)
├── docs/                          # Screenshots, logo
└── plans/                         # Architecture docs
```

## INITIALIZATION FLOW

### Backend (Rust/Tauri)

```
main.rs:4-5
└── openman_lib::run()
    └── lib.rs:14-27 Tauri::Builder
        ├── lib.rs:16-18 Plugins (shell, dialog, fs)
        ├── lib.rs:19-26 setup hook
        │   ├── lib.rs:22 APP_HANDLE.set() - Global singleton
        │   └── storage/mod.rs:10-14 create directories
        └── lib.rs:28-58 register 21 IPC commands
```

### Frontend (React)

```
App.tsx:189-196
└── BrowserRouter → AppContent
    ├── App.tsx:31-33  useEffect #1: initWorkspace()
    │   └── useWorkspaceStore.ts:33-50 → invoke("get_default_workspace")
    ├── App.tsx:116-121 useEffect #5: loadCollections + loadEnvironments (after workspace ready)
    │   ├── useCollectionStore.ts:68-85
    │   └── useEnvironmentStore.ts:38-56
    ├── App.tsx:36-65  useEffect #2: initBehaviorTracking()
    ├── App.tsx:68-70  useEffect #3: applyTheme()
    └── App.tsx:73-113 useEffect #4: keyboard shortcuts
```

**Key dependency:** Collections/Environments wait for `initialized && currentWorkspace` (App.tsx:117)

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new HTTP feature | `src/pages/RequestBuilder.tsx`, `src-tauri/src/commands/http.rs` | Follow IPC bridge pattern |
| Add new UI component | `src/components/common/` | Create component + test + story |
| Add new Zustand store | `src/stores/use<Domain>Store.ts` | Export from `stores/index.ts` |
| Add new Tauri command | `src-tauri/src/commands/`, register in `lib.rs` | Use `#[command]` attribute |
| Add new Rust model | `src-tauri/src/models/` | Use `#[serde(rename_all = "camelCase")]` |
| Add storage operation | `src-tauri/src/storage/`, wire via storageService | JSON file CRUD pattern |
| Modify HTTP engine | `src-tauri/src/engines/http_engine.rs` | reqwest client, proxy support |
| Add environment variable | `src-tauri/src/models/environment.rs` + frontend store | Variable substitution in httpService |
| Add import/export format | `src-tauri/src/utils/import_export.rs` | Postman v2.1 format |
| Add E2E test | `e2e/*.spec.ts` | Use Tauri mock fixture |
| Add unit test | `src/**/*.test.tsx` | Co-located with source |
| Add Storybook story | `src/components/common/stories/*.stories.tsx` | Vitest addon integration |
| Modify theme | `tailwind.config.js`, `src/index.css` | CSS variables for light/dark |
| Add keyboard shortcut | `src/App.tsx` useEffect | Global event listeners |
| Debug IPC issues | Check invoke params, Rust command signature | Service layer transforms types |
| Debug state issues | `src/stores/*.ts` | Check Zustand getState() calls |
| Debug HTTP errors | `src-tauri/src/engines/http_engine.rs` | Detailed error messages returned |

---

## NAMING CONVENTIONS

### Frontend (TypeScript/React)

#### Files
- **Components**: PascalCase — `Checkbox.tsx`, `HttpPanel.tsx`
- **Stores**: camelCase with `use` prefix — `useWorkspaceStore.ts`
- **Services**: camelCase — `httpService.ts`, `storageService.ts`
- **Types**: camelCase — `types/layout.ts`
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
- Cross-store access: `useXStore.getState().property`

#### CSS Classes (Tailwind)
- Custom color palette: `bg-accent-orange`, `bg-card-bg`, `text-text-primary`
- Use semantic color names, not raw hex values
- CSS variables in `index.css` for theme support

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

## KEY ARCHITECTURE DECISIONS

### 1. IPC Bridge Pattern
Frontend communicates with Rust backend via Tauri's `invoke` API:
```typescript
// Frontend (httpService.ts)
const response = await invoke<RustHttpResponse>("send_http_request", { request, proxySettings });

// Backend (commands/http.rs)
#[command]
pub async fn send_http_request(request: HttpRequest, proxy_settings: Option<ProxySettings>) -> Result<HttpResponse, String>
```

### 2. Data Transformation Layer
Service files transform frontend types to backend-compatible format:
- `httpService.ts` — transforms `HttpRequest` to `RustHttpRequest`
- Variable substitution (`{{variable}}`) happens in service layer before sending to backend
- Response transformation back to frontend types

### 3. JSON Serialization Convention
Rust structs use `#[serde(rename_all = "camelCase")]` for frontend compatibility:
- Backend: `created_at` → Frontend: `createdAt`
- Backend: `response_time` → Frontend: `responseTime`

### 4. State Management Pattern
Zustand stores with async actions and cross-store communication:
```typescript
interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  // Actions
  initialize: () => Promise<void>;
  loadWorkspaces: () => Promise<void>;
}

// Cross-store access
const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
```

### 5. Error Handling
- **Backend**: Detailed error messages with troubleshooting suggestions, formatted for user display
- **Frontend**: Errors shown in response panel (body tab) with `status: 0, statusText: "Error"`
- No error banners — users need readable multi-line messages

### 6. Proxy Configuration Flow
SettingsPage → useWorkspaceStore → httpService → Rust backend
- Proxy settings stored per-workspace in `WorkspaceSettings`
- `no_proxy` bypass string supported (comma-separated domains)
- HTTP proxy with authentication support

### 7. History Restoration
- History items include `lastResponse` for full state restoration
- Click history → restore params, headers, body, AND response
- Stored as JSON files in `{workspace}/history/{id}.json`

### 8. Request Body Serialization
Frontend sends structured body:
```typescript
{ mode: "json", content: "..." }
```
Rust expects matching enum:
```rust
RequestBody::Json { content: String }
```

### 9. Global AppHandle Pattern
Backend uses `OnceLock<AppHandle>` singleton for storage access without threading AppHandle through every function:
```rust
pub static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();
// Storage modules access via: crate::APP_HANDLE.get()
```

---

## TAURI COMMANDS (23 Total)

### HTTP (1)
| Command | Called From |
|---------|-------------|
| `send_http_request(request, proxy_settings)` | `httpService.ts:sendHttpRequest()` |

### Workspace (4)
| Command | Called From |
|---------|-------------|
| `get_workspaces()` | `storageService.ts:getWorkspaces()` |
| `get_default_workspace()` | `useWorkspaceStore.ts:initialize()` |
| `create_workspace(name, description)` | Settings page |
| `update_workspace_settings(workspace_id, settings)` | `useWorkspaceStore.ts` |

### Collection (5)
| Command | Called From |
|---------|-------------|
| `get_collections(workspace_id)` | `useCollectionStore.ts:loadCollections()` |
| `get_collection(workspace_id, collection_id)` | Sidebar selection |
| `create_collection(workspace_id, name, description)` | CreateCollectionModal |
| `update_collection(workspace_id, collection)` | Drag-drop reorder |
| `delete_collection(workspace_id, collection_id)` | Delete modal |

### Environment (6)
| Command | Called From |
|---------|-------------|
| `get_environments(workspace_id)` | `useEnvironmentStore.ts:loadEnvironments()` |
| `get_environment(workspace_id, environment_id)` | Environment editor |
| `create_environment(workspace_id, name)` | CreateEnvironmentModal |
| `update_environment(workspace_id, environment)` | Variable editor |
| `delete_environment(workspace_id, environment_id)` | Delete modal |
| `set_active_environment(workspace_id, environment_id)` | Dropdown selection |

### Import/Export (4)
| Command | Called From |
|---------|-------------|
| `import_postman_collection(workspace_id, json)` | ImportModal |
| `export_postman_collection(workspace_id, collection_id)` | ExportModal |
| `import_environment(workspace_id, json)` | ImportModal |
| `export_environment(workspace_id, environment_id)` | ExportModal |

### Logging (3)
| Command | Called From |
|---------|-------------|
| `log_user_action(...)` | `fileLogger.ts` |
| `get_logs(date)` | Settings/logs viewer |
| `get_log_dates_list()` | Settings/logs viewer |

---

## VERIFICATION COMMANDS

For npm scripts, see [README.md - Available Scripts](README.md#available-scripts).

### Development
```bash
npm run dev              # Frontend only (port 1420)
npm run tauri -- dev     # Full desktop app (note the --)
npm run test:server      # Mock API server for testing
```

### Build
```bash
npm run build            # Frontend only
npm run tauri -- build   # Production app (note the --)
npm run preview          # Preview production build
```

### Rust Commands
```bash
cd src-tauri && cargo check    # Check compilation
cd src-tauri && cargo test     # Run Rust tests
cd src-tauri && cargo fmt      # Format code
cd src-tauri && cargo clippy   # Linter
```

### CI Verification
```bash
gh run list --limit 5          # List recent runs
gh run watch                   # Watch current run
gh run view <run-id>           # View specific run
```

---

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| ci.yml | push/PR | Lint, unit tests, E2E tests, build, Storybook |
| release.yml | tag `v*` | Multi-platform builds (macOS ARM/x64, Ubuntu, Windows) |

**CI Pipeline:**
1. lint — ESLint check
2. test-unit — Vitest with coverage, Codecov upload
3. test-e2e — Playwright tests
4. build-frontend — Vite build
5. build-storybook — Static Storybook

**Release Pipeline:**
- Triggered by pushing tag matching `v*` (e.g., `v0.2.0`)
- Tauri action for automated builds
- Signed builds with TAURI_PRIVATE_KEY
- All platforms: macOS (aarch64, x64), Windows (x64), Linux (amd64)
- Creates draft release on GitHub

---

## RELEASING

### Quick Release

```bash
npm run release:check           # Verify prerequisites
npm run release:prepare 0.2.0   # Bump, test, commit, tag
git push origin main
git push origin v0.2.0
gh run watch
```

### Prerequisites

- GitHub secrets configured (`TAURI_PRIVATE_KEY`, `TAURI_KEY_PASSWORD`)
- GitHub CLI authenticated (`gh auth login`)
- Generate signing key: `tauri signer generate -w ~/.tauri/openman.key`

### Scripts

| Script | Purpose |
|--------|---------|
| `version:bump 0.2.0` | Update version in all files (`scripts/version-bump.cjs`) |
| `version:verify` | Check version consistency (`scripts/version-verify.cjs`) |
| `release:check` | Validate prerequisites (`scripts/release-check.cjs`) |
| `release:prepare 0.2.0` | Full release preparation (`scripts/release-prepare.cjs`) |

### Version Files (9 files, ~17 locations)

Automated by `version:bump` script:

```
package.json
src-tauri/Cargo.toml
src-tauri/tauri.conf.json
src/App.tsx
src/pages/SettingsPage.tsx
src/services/fileLogger.ts
e2e/fixtures/tauri-mock.ts
e2e/logging.spec.ts
e2e/settings.spec.ts
```

### Post-Release

- Verify all 4 platform builds uploaded (macOS ARM, macOS x64, Windows, Linux)
- Test installation on at least one target platform
- Edit draft release on GitHub with changelog

### Rollback

```bash
git tag -d vx.y.z
git push origin :refs/tags/vx.y.z
# Fix issues, bump version to x.y.z+1, retry
```

---

## CONTRIBUTING CHECKLIST

### Before Committing
1. `npm run lint` — 0 warnings required
2. `npm run test:run` — all pass
3. `npm run test:e2e` — all pass (if applicable)
4. `cd src-tauri && cargo check` — compiles

### Pull Request
1. Fork → branch → commit → push → PR
2. Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
3. CI must pass (lint, unit tests, E2E tests)

For detailed contributing guidelines, see [README.md - Contributing](README.md#contributing).

---

## NOTES

- **Storage:** `{app_data_dir}/workspaces/{workspace_id}/{type}/{id}.json`
- **Logs:** `{app_data_dir}/logs/openman-{YYYY-MM-DD}.log`
- **Variable syntax:** `{{variable_name}}` substituted by `httpService.ts`
- **HTTP timeout:** 30 seconds (configurable in `http_engine.rs`)
- **Dev server port:** 1420 (E2E tests target this)
- **Window size:** 1400x900 default, 800x600 minimum
- **Theme:** System preference via `matchMedia("(prefers-color-scheme: dark)")`

---

## REFERENCE

- [README.md](README.md) - User documentation (features, installation, roadmap)
- [plans/openman-architecture.md](plans/openman-architecture.md) - Detailed architecture
- [.github/workflows/ci.yml](.github/workflows/ci.yml) - CI pipeline configuration

---

## COMMON PITFALLS

| Issue | Cause | Solution |
|-------|-------|----------|
| `npm run tauri dev` fails | Wrong syntax | Use `npm run tauri -- dev` (note the `--`) |
| IPC call returns error | Type mismatch | Check Rust struct matches frontend type exactly |
| Variable not substituted | Missing env | Ensure environment has variable, check `{{variable}}` syntax |
| Store state stale | Used outside React | Use `useXStore.getState()` for cross-store access |
| E2E tests fail | Port conflict | Kill process on port 1420: `lsof -ti:1420 | xargs kill` |
| Rust build slow | Debug mode | Use `cargo build --release` for performance testing |
| Release fails | Missing TAURI_PRIVATE_KEY | Generate with `tauri signer generate`, add to GitHub secrets |
| Version mismatch | Forgot to update all files | Use grep to find all occurrences: `grep -r "0.1.0\|v0.1"` |
| Release not triggered | Wrong tag format | Tag must match `v*` pattern (e.g., `v0.2.0`) |

---

## ANTI-PATTERNS

### TypeScript
```typescript
// ❌ NEVER
const data: any = fetchData();
// @ts-ignore
someCall();

// ✅ ALWAYS
const data: MyType = fetchData();
// Fix the type or use proper type assertion
```

### Rust
```rust
// ❌ NEVER - Empty catch loses error context
match result {
    Ok(_) => {},
    Err(_) => {},  // Swallowed error
}

// ✅ ALWAYS - Handle or propagate
match result {
    Ok(data) => process(data),
    Err(e) => return Err(format!("Failed to X: {}", e)),
}
```

### What Happens If Violated
| Violation | Consequence |
|-----------|-------------|
| `as any` | Runtime crashes, no IDE support |
| Empty catch | Silent failures, impossible to debug |
| Missing serde rename | Frontend receives `snake_case` fields, breaks |
| Raw types to invoke | IPC serialization fails silently |

---

## AI ASSISTANT NOTES

### Code Review Enforcement
When reviewing code, check:

1. **TypeScript:**
   - No `as any`, `@ts-ignore`, `@ts-expect-error`
   - All imports use relative paths (no `@/` aliases)
   - Components use named exports

2. **Rust:**
   - All structs have `#[serde(rename_all = "camelCase")]`
   - Error messages include troubleshooting hints
   - No `unwrap()` in production code (use `?` or `map_err`)

3. **Patterns:**
   - Service layer transforms types before `invoke()`
   - Zustand stores use `getState()` for cross-store access
   - Tests co-located with source files

### Testing Requirements
| Layer | Requirement |
|-------|-------------|
| Components | `.test.tsx` file alongside |
| Common UI | `.stories.tsx` in `stories/` |
| Stores | Mock Tauri invoke in tests |
| IPC | Integration test via Playwright |
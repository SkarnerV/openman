# OpenMan - Feature Analysis & Implementation Plan

## Current State Summary

### What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| **HTTP Request Builder** | ✅ Basic | Can send GET/POST/PUT/DELETE requests |
| **Request/Response UI** | ✅ Basic | Tabs for params, headers, body, auth |
| **Collections Page** | ✅ UI Only | Grid view, empty state - but not persisted |
| **History Page** | ✅ UI Only | Date-grouped list - but not persisted |
| **Environments Page** | ✅ UI Only | Variable editor - but not persisted |
| **Settings Page** | ✅ UI Only | General/Editor/Shortcuts sections |
| **Activity Bar** | ✅ Done | Navigation icons |
| **Sidebar** | ✅ Done | Search, collections tree, environment dropdown |
| **Design System** | ✅ Done | Colors, typography, spacing tokens |
| **Routing** | ✅ Done | React Router with all pages |
| **Backend HTTP Engine** | ✅ Basic | reqwest-based, supports methods, headers, body, auth |
| **Backend Storage** | ✅ Partial | Workspaces, collections, environments CRUD |

### What's Missing/Broken

| Feature | Gap | Priority |
|---------|-----|----------|
| **Persistence** | Frontend stores not connected to backend | HIGH |
| **Query Parameters** | UI placeholder only, not functional | HIGH |
| **Request Body Types** | form-data, x-www-form-urlencoded, binary not implemented | MEDIUM |
| **Auth Implementation** | UI only, not connected to requests | HIGH |
| **Save Request to Collection** | Button exists but no functionality | HIGH |
| **Edit/Delete Collection Items** | UI only, no backend calls | MEDIUM |
| **Environment Variable Substitution** | Variables defined but not used in requests | HIGH |
| **Import/Export Collections** | Backend exists, no frontend UI | MEDIUM |
| **gRPC Support** | UI stub only, no backend | LOW |
| **MCP Support** | UI stub only, no backend | LOW |
| **Cookies** | Response tab placeholder | LOW |
| **Response Formatting** | JSON only, no XML/HTML views | LOW |
| **Keyboard Shortcuts** | Listed in settings but not implemented | MEDIUM |
| **Theme Switching** | UI exists but doesn't work | LOW |

---

## Implementation Plan

### Phase 1: Core Functionality (HIGH PRIORITY)

#### 1.1 Connect Frontend to Backend Storage
**Goal:** Persist collections, environments, and history

**Files to modify:**
- `src/stores/useCollectionStore.ts` - Add Tauri invoke calls
- `src/stores/useEnvironmentStore.ts` - Add Tauri invoke calls
- `src/stores/useRequestStore.ts` - Persist history
- `src-tauri/src/commands/storage.rs` - Add update/delete commands

**Tasks:**
1. Add `update_collection`, `delete_collection` commands in Rust
2. Add `update_environment`, `delete_environment` commands in Rust
3. Update frontend stores to call backend on changes
4. Load data on app startup

#### 1.2 Query Parameters Tab
**Goal:** Functional query params editor

**Files to modify:**
- `src/pages/RequestBuilder.tsx` - Implement params tab
- `src/stores/useRequestStore.ts` - Add params to request type

**Tasks:**
1. Add QueryParam interface to store
2. Create params editor UI (key-value pairs with enable/disable)
3. Append params to URL when sending request

#### 1.3 Authentication Implementation
**Goal:** Working auth that integrates with requests

**Files to modify:**
- `src/pages/RequestBuilder.tsx` - Connect auth form to request
- `src/stores/useRequestStore.ts` - Use existing auth types

**Tasks:**
1. Bearer Token - Add token input, inject Authorization header
2. Basic Auth - Add username/password inputs, encode and inject
3. API Key - Add key/value inputs, inject as header or query param

#### 1.4 Save Request to Collection
**Goal:** Save current request to a collection

**Files to modify:**
- `src/pages/RequestBuilder.tsx` - Save button functionality
- `src/components/common/SaveRequestModal.tsx` (NEW) - Modal to select collection

**Tasks:**
1. Create SaveRequestModal component
2. Add save functionality to RequestBuilder
3. Update collection in backend

#### 1.5 Environment Variable Substitution
**Goal:** Use `{{variable}}` syntax in URLs, headers, body

**Files to modify:**
- `src/services/httpService.ts` - Add variable substitution
- `src/stores/useEnvironmentStore.ts` - Export active variables

**Tasks:**
1. Create variable substitution function
2. Apply to URL, headers, and body before sending
3. Show preview of substituted values

---

### Phase 2: Enhanced Features (MEDIUM PRIORITY)

#### 2.1 Import/Export Collections
**Goal:** Import Postman collections, export as JSON

**Files to create/modify:**
- `src/components/collections/ImportModal.tsx` (NEW)
- `src/components/collections/ExportModal.tsx` (NEW)
- `src/pages/CollectionsPage.tsx` - Add import/export buttons

**Tasks:**
1. Create import modal with file picker
2. Call `import_postman_collection` backend command
3. Create export modal
4. Call `export_postman_collection` and download file

#### 2.2 Additional Body Types
**Goal:** Support form-data and x-www-form-urlencoded

**Files to modify:**
- `src/pages/RequestBuilder.tsx` - Add form-data editor
- `src-tauri/src/engines/http_engine.rs` - Handle form bodies
- `src-tauri/src/models/request.rs` - Update RequestBody enum

**Tasks:**
1. Add form-data UI (key-value pairs with file support)
2. Add url-encoded UI
3. Update Rust backend to handle these types

#### 2.3 Keyboard Shortcuts
**Goal:** Working shortcuts as listed in settings

**Files to create:**
- `src/hooks/useKeyboardShortcuts.ts` (NEW)

**Tasks:**
1. Create keyboard shortcut hook
2. Implement: Ctrl+Enter (send), Ctrl+S (save), Ctrl+N (new)
3. Register globally in App.tsx

#### 2.4 Request/Response Code Editors
**Goal:** Better editing experience with syntax highlighting

**Dependencies to add:**
- `@codemirror/lang-json`
- `@uiw/react-codemirror`

**Tasks:**
1. Replace textareas with CodeMirror
2. Add JSON syntax highlighting
3. Add auto-format option

---

### Phase 3: Nice-to-Have (LOW PRIORITY)

#### 3.1 gRPC Support
**Scope:** Full gRPC client functionality

**Tasks:**
1. Proto file parsing in Rust
2. gRPC reflection support
3. Service/method discovery
4. Request builder UI
5. Streaming support

#### 3.2 MCP Support
**Scope:** Model Context Protocol client

**Tasks:**
1. MCP protocol implementation
2. Server connection management
3. Tools/Resources/Prompts UI
4. Invocation and response handling

#### 3.3 Response Enhancements
**Tasks:**
1. XML/HTML response viewing
2. Response preview (rendered HTML)
3. Cookie management
4. Response history comparison

#### 3.4 Theme Switching
**Tasks:**
1. Implement light theme CSS variables
2. Add theme toggle functionality
3. Persist theme preference

---

## Recommended Implementation Order

```
Week 1: Phase 1.1-1.3 (Persistence, Params, Auth)
Week 2: Phase 1.4-1.5 (Save Request, Variable Substitution)
Week 3: Phase 2.1-2.2 (Import/Export, Body Types)
Week 4: Phase 2.3-2.4 (Shortcuts, Code Editor)
Later:  Phase 3 (gRPC, MCP, enhancements)
```

---

## Architecture Notes

### Current Stack
- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **State:** Zustand (needs backend connection)
- **Backend:** Tauri 2.0 + Rust
- **HTTP Client:** reqwest (Rust)

### Key Files
| Purpose | Frontend | Backend |
|---------|----------|---------|
| Request Builder | `src/pages/RequestBuilder.tsx` | `src-tauri/src/engines/http_engine.rs` |
| Collections | `src/stores/useCollectionStore.ts` | `src-tauri/src/storage/collection.rs` |
| Environments | `src/stores/useEnvironmentStore.ts` | `src-tauri/src/storage/environment.rs` |
| Storage Bridge | `src/services/storageService.ts` | `src-tauri/src/commands/storage.rs` |

### Data Flow
```
Frontend (Zustand Store)
    ↓ invoke()
Tauri Commands (storage.rs)
    ↓
Storage Layer (JSON files)
```

---

## Verification Checklist

After each phase, verify:
- [ ] All TypeScript errors resolved (`npm run build`)
- [ ] App starts without errors (`npm run tauri dev`)
- [ ] Feature works as expected
- [ ] Data persists across app restarts
- [ ] No console errors
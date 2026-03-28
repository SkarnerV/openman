# Environment Creation Bug Fix

## Problem

When attempting to create a new environment, the operation failed with an error:
```
invalid args `workspaceId` for command `create_environment`: command create_environment missing required key workspaceId
```

## Root Cause

The bug was caused by a misunderstanding of **Tauri 2's parameter naming conventions**.

### Tauri Parameter Conversion

In Tauri 2, there's an automatic conversion between Rust function parameter names and frontend invoke parameter names:

| Rust (snake_case) | Frontend (camelCase) |
|-------------------|----------------------|
| `workspace_id`    | `workspaceId`        |
| `collection_id`   | `collectionId`       |
| `environment_id`  | `environmentId`      |

When you define a Rust command like:
```rust
#[command]
pub fn create_environment(workspace_id: String, name: String) -> Result<Environment, String>
```

The frontend must call it with **camelCase** parameter names:
```typescript
invoke("create_environment", { workspaceId: "ws-1", name: "Production" })
```

### What Went Wrong

Initially, the frontend code was using **camelCase** parameters (`workspaceId`), but we incorrectly assumed Tauri required **snake_case** to match the Rust side. We changed all the invoke calls to use snake_case:

```typescript
// WRONG - this was our mistaken "fix"
invoke("create_environment", { workspace_id: "ws-1", name: "Production" })
```

This caused Tauri to reject the parameters because it expected the auto-converted camelCase names.

## Solution

Reverted all invoke calls to use **camelCase** parameter names, matching Tauri's automatic conversion:

```typescript
// CORRECT - matches Tauri 2 convention
invoke("create_environment", { workspaceId: "ws-1", name: "Production" })
invoke("get_environments", { workspaceId: "ws-1" })
invoke("set_active_environment", { workspaceId: "ws-1", environmentId: "env-1" })
```

## Additional Fix: Modal for Environment Creation

The original implementation used `window.prompt()` which doesn't work in Tauri's webview environment. We replaced it with a proper modal component (`CreateEnvironmentModal`) that:
- Provides a text input for the environment name
- Shows validation errors
- Handles Tauri error responses (which may be strings, not Error instances)

## Files Changed

1. `src/services/storageService.ts` - Fixed all invoke parameter names to camelCase
2. `src/components/common/CreateEnvironmentModal.tsx` - New modal component
3. `src/pages/EnvironmentsPage.tsx` - Uses modal instead of `prompt()`
4. `src/stores/useEnvironmentStore.ts` - Fixed `is_active` → `isActive` property mismatch
5. `src/services/storageService.test.ts` - Updated tests to expect camelCase

## Lessons Learned

1. **Tauri 2 auto-converts parameter names** - Rust snake_case becomes frontend camelCase
2. **Test the actual error message** - The error `missing required key workspaceId` revealed that Tauri expected camelCase, not snake_case
3. **Browser APIs may not work in Tauri** - `window.prompt()`, `window.alert()`, etc. may not function properly in Tauri's webview; use custom UI components instead
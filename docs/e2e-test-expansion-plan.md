# Plan: Comprehensive E2E Test Expansion

## Context

The existing `e2e/app.spec.ts` (691 lines) already covers the main happy paths:
- App initialization and error states
- Navigation between pages
- Sidebar toggle and search
- Request Builder basics (URL, method, params, headers, body, auth)
- Collections page (display, search, create)
- Environments page (display, create)
- Settings page (theme, navigation)
- Keyboard shortcuts
- One full workflow test

**Gap Analysis** - What's NOT tested:
1. **Drag-and-drop** in sidebar (move requests between collections)
2. **History page** beyond empty state
3. **Collection/request deletion and editing**
4. **Environment variable management**
5. **Error handling** (network errors, invalid URLs)
6. **Additional HTTP methods** (PUT, PATCH, DELETE)
7. **Additional body types** (form-data, x-www-form-urlencoded)
8. **API Key auth**
9. **Settings persistence**

---

## Test File Structure

Split tests into focused spec files for maintainability:

```
e2e/
├── app.spec.ts           # Existing - keep as smoke tests
├── fixtures/
│   └── tauri-mock.ts     # Shared mock utilities
├── request-builder.spec.ts
├── sidebar.spec.ts
├── collections.spec.ts
├── environments.spec.ts
├── history.spec.ts
└── settings.spec.ts
```

---

## Implementation Plan

### Phase 1: Create Shared Test Fixtures

**File: `e2e/fixtures/tauri-mock.ts`**

Extract the mock utilities from `app.spec.ts` into reusable functions:
- `buildTauriMockScript()` - mock Tauri invoke
- `loadApp()` - page setup helper
- `MOCK_COLLECTIONS`, `MOCK_ENVIRONMENTS`, `MOCK_HTTP_RESPONSE` - test data

### Phase 2: Sidebar Drag-and-Drop Tests

**File: `e2e/sidebar.spec.ts`**

Tests for `src/components/layout/Sidebar.tsx`:

1. **Drag request within same collection** (reorder)
   - Drag "Create User" above "List Users"
   - Verify order changed

2. **Drag request between collections**
   - Drag "List Users" from "Users API" to "Auth API"
   - Verify request appears in destination
   - Verify removed from source

3. **Drag visual feedback**
   - Verify `dragOverCollectionId` highlights target
   - Verify drop zones appear

### Phase 3: Collections Management Tests

**File: `e2e/collections.spec.ts`**

Tests for `src/pages/CollectionsPage.tsx`:

1. **Delete collection**
   - Click delete button, confirm in dialog
   - Verify collection removed from list and sidebar

2. **Edit collection name/description**
   - Click edit, modify fields, save
   - Verify changes persisted

3. **Delete request from collection**
   - Expand collection, delete a request
   - Verify request count updated

4. **Duplicate request**
   - Click duplicate on a request
   - Verify copy appears with "(Copy)" suffix

### Phase 4: Environments Management Tests

**File: `e2e/environments.spec.ts`**

Tests for `src/pages/EnvironmentsPage.tsx`:

1. **Add variable to environment**
   - Select environment, fill key/value, click add
   - Verify variable appears in list

2. **Toggle variable enabled state**
   - Click checkbox to disable variable
   - Verify unchecked state

3. **Delete variable from environment**
   - Click delete on a variable row
   - Verify variable removed

4. **Set active environment**
   - Click "Set Active" on non-active environment
   - Verify "Active" badge moves

5. **Delete environment**
   - Click delete, confirm in dialog
   - Verify environment removed

### Phase 5: History Page Tests

**File: `e2e/history.spec.ts`**

Tests for `src/pages/HistoryPage.tsx`:

1. **View request history**
   - Send multiple requests
   - Navigate to history page
   - Verify items appear grouped by date

2. **Filter history by method**
   - Use method dropdown filter
   - Verify only matching methods shown

3. **Search history**
   - Enter search query
   - Verify filtered results

4. **Reload request from history**
   - Click a history item
   - Verify navigates to request builder with request loaded

5. **Clear history**
   - Click "Clear History" button
   - Verify empty state shown

### Phase 6: Request Builder Advanced Tests

**File: `e2e/request-builder.spec.ts`**

Additional tests for `src/pages/RequestBuilder.tsx`:

1. **All HTTP methods**
   - PUT, PATCH, DELETE, HEAD, OPTIONS via dropdown

2. **Body types**
   - Form-data: add fields, toggle enabled
   - x-www-form-urlencoded: add fields
   - Raw: select language, enter content

3. **API Key auth**
   - Select API Key auth type
   - Enter key, value, select add location (header/query)

4. **Error handling**
   - Invalid URL format → verify error shown
   - Network timeout → verify timeout error
   - 4xx/5xx responses → verify status displayed

5. **Copy response**
   - Send request, click copy button
   - Verify copied to clipboard (mock clipboard)

### Phase 7: Settings Persistence Tests

**File: `e2e/settings.spec.ts`**

Additional tests for `src/pages/SettingsPage.tsx`:

1. **Editor settings**
   - Change font size → verify applied to editors
   - Change tab size → verify applied
   - Toggle word wrap → verify applied

2. **Settings persistence**
   - Change theme to Light
   - Reload page
   - Verify theme persists

---

## Critical Files to Modify

| File | Purpose |
|------|---------|
| `e2e/fixtures/tauri-mock.ts` | New - shared mock utilities |
| `e2e/sidebar.spec.ts` | New - drag-drop and sidebar tests |
| `e2e/collections.spec.ts` | New - collection CRUD tests |
| `e2e/environments.spec.ts` | New - environment variable tests |
| `e2e/history.spec.ts` | New - history page tests |
| `e2e/request-builder.spec.ts` | New - advanced request builder tests |
| `e2e/settings.spec.ts` | New - settings persistence tests |
| `e2e/app.spec.ts` | Modify - extract mock utilities |

---

## Verification

After implementation, run all tests:

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/sidebar.spec.ts

# Run with UI for debugging
npx playwright test --ui
```

Expected: All tests pass, no timeouts, no flaky behavior.

---

## Estimated Test Count

| Spec File | New Tests |
|-----------|-----------|
| fixtures/tauri-mock.ts | 0 (utility) |
| sidebar.spec.ts | 3 |
| collections.spec.ts | 4 |
| environments.spec.ts | 5 |
| history.spec.ts | 5 |
| request-builder.spec.ts | 8 |
| settings.spec.ts | 3 |
| **Total** | **28 new tests** |

---

## Priority Order

1. **High** - Sidebar drag-drop (critical feature, known bugs per docs)
2. **High** - History page (core workflow)
3. **Medium** - Collection/Environment CRUD
4. **Medium** - Request builder advanced
5. **Low** - Settings persistence
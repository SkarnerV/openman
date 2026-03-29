# Sidebar drag-and-drop bug fix (reflection)

## What happened?

Two related issues showed up in the collections sidebar:

1. **HTML5 drag and drop did nothing** — users could start a drag (the UI reacted), but dropping never completed a move between collections or reorder inside a list.
2. **After the first fix, cross-collection moves worked, but reordering within the same collection often failed** — sometimes with a store error like “Request not found in source collection,” and sometimes the UI’s idea of “which collection holds this request” disagreed with persisted state.

## How we found the problem

We treated this as a runtime investigation, not a code-only guess.

### Phase 1: Drop never fired

We added lightweight instrumentation (NDJSON logs to a local debug ingest endpoint) around:

- `dragstart` / `dragend`
- `drop` handlers on collection headers and between-request drop zones
- `moveRequest` in the collection store

**Evidence:** Logs showed many `dragstart` / `dragend` pairs with the drag ref still populated on `dragend`, but **no** `drop` events and **no** `moveRequest` calls. So the bug was not “Zustand wrong” or “moveRequest broken” — the browser/webview never delivered `drop` to our handlers.

### Phase 2: Reorder failed after drops worked

Once drops fired, logs showed `drop_request_zone` and `moveRequest` **did** run for same-collection reorder, but **sometimes threw** “Request not found in source collection.” Other lines in the same session showed the same request id had already been moved to another collection while the drag payload still carried the **old** `sourceCollectionId` from `dragstart`.

**Evidence:** `moveRequest` looked up the request **only** in the collection id passed from the sidebar ref, which can lag behind the store after other moves or async updates.

## What we changed

### Making `drop` work (Tauri / WebKit)

- **Tauri:** Set `dragDropEnabled: false` on the window in `tauri.conf.json`. When Tauri’s webview drag/drop handling is left on (the default), it can intercept drags so in-page HTML5 `drop` never runs the way it does in a normal browser tab.
- **WebKit / WKWebView:** Set both `text/plain` and `application/json` on `dataTransfer` in `dragstart`. WebKit is picky; many reports and upstream issues note that **without** `text/plain`, internal HTML5 drags may never complete a drop.
- **Drop targets:** Call `preventDefault()` on **`dragenter`** as well as `dragover` on collection headers and gap “DropZone” elements, matching what several engines expect for a valid drop target.

### Making reorder and moves reliable (store)

- **Resolve the real owner:** Before moving, find the request id across **all** collections and use that collection as the source (`findOwningCollectionForRequest` + `resolvedSourceId`). The first argument from the UI remains for API compatibility but is no longer trusted as the sole source of truth.
- **Same-collection reorder:** Persist with `updateCollection(resolvedSourceId, …)`, not the declared source id from drag-start (a real bug: wrong id could mean updating the wrong collection’s `items` array).

## Why did this happen?

1. **Platform stack:** Openman ships as a **Tauri** app using a **WKWebView**-backed webview. HTML5 drag-and-drop behaves closer to Safari/WebKit than to Chrome. Defaults that work in `vite` + Chrome do not automatically work in the embedded webview.

2. **Implicit coupling:** Drag code stored `sourceCollectionId` from the row that **rendered** the item. That is correct at render time but can be **stale** by drop time if another operation moved the same request or if updates reorder reality before the gesture ends. Looking up only in that collection caused “not found” and inconsistent reorder.

3. **Split responsibilities:** Drop zones and headers lived in React; persistence lived in Zustand + Tauri storage. Without logs, it is easy to assume the bug is in `moveRequest` when the first failure mode is simply “`drop` never called.”

## Takeaways

- **Confirm the event pipeline first** (`dragstart` → `dragover`/`dragenter` → `drop`) before optimizing store logic.
- **Desktop webviews need explicit configuration** (`dragDropEnabled`) and often WebKit-oriented DnD workarounds (`text/plain`, `dragenter`).
- **Gestures should converge on authoritative state** at execution time (where the item lives **now** in the store), not only on the props captured at `dragstart`.

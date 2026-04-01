import { create } from "zustand";
import {
  getCollections,
  createCollection as createCollectionApi,
  updateCollection as updateCollectionApi,
  deleteCollection as deleteCollectionApi,
  type Collection,
  type CollectionItem,
  type HttpRequest,
  toRequestCollectionItem,
} from "../services/storageService";
import { useWorkspaceStore } from "./useWorkspaceStore";

/** Matches sidebar `isRequestItem`: draggable request rows only (excludes nested collection folders). */
function isRequestEntry(item: CollectionItem): boolean {
  return "method" in item && ("type" in item ? item.type === "request" : true);
}

function findOwningCollectionForRequest(
  collections: Collection[],
  requestId: string
): { collection: Collection; item: CollectionItem } | null {
  for (const c of collections) {
    const item = c.items.find((i) => ("id" in i ? i.id : "") === requestId);
    if (item && isRequestEntry(item)) {
      return { collection: c, item };
    }
  }
  return null;
}

interface CollectionState {
  collections: Collection[];
  activeCollection: Collection | null;
  selectedRequest: HttpRequest | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;

  // Actions
  loadCollections: () => Promise<void>;
  createCollection: (name: string, description?: string) => Promise<Collection>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  duplicateCollection: (collectionId: string) => Promise<void>;
  setActiveCollection: (collection: Collection | null) => void;
  setSelectedRequest: (request: HttpRequest | null) => void;
  addRequestToCollection: (collectionId: string, request: HttpRequest) => Promise<void>;
  updateRequestInCollection: (collectionId: string, request: HttpRequest) => Promise<void>;
  deleteRequestFromCollection: (collectionId: string, requestId: string) => Promise<void>;
  duplicateRequest: (collectionId: string, requestId: string) => Promise<void>;
  moveRequest: (
    sourceCollectionId: string,
    requestId: string,
    targetCollectionId: string,
    targetIndex?: number
  ) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  activeCollection: null,
  selectedRequest: null,
  isLoading: false,
  error: null,
  initialized: false,

  loadCollections: async () => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
    if (!workspaceId) {
      console.warn("No workspace selected");
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const collections = await getCollections(workspaceId);
      set({ collections, isLoading: false, initialized: true });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load collections",
        isLoading: false,
      });
    }
  },

  createCollection: async (name: string, description?: string) => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
    if (!workspaceId) throw new Error("No workspace selected");

    const collection = await createCollectionApi(workspaceId, name, description);
    set((state) => ({
      collections: [...state.collections, collection],
    }));
    return collection;
  },

  updateCollection: async (id: string, updates: Partial<Collection>) => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
    if (!workspaceId) throw new Error("No workspace selected");

    const collection = get().collections.find((c) => c.id === id);
    if (!collection) throw new Error("Collection not found");

    const updatedCollection = { ...collection, ...updates, updatedAt: new Date().toISOString() };
    await updateCollectionApi(workspaceId, updatedCollection);

    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? updatedCollection : c
      ),
      activeCollection:
        state.activeCollection?.id === id ? updatedCollection : state.activeCollection,
    }));
  },

  deleteCollection: async (id: string) => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
    if (!workspaceId) throw new Error("No workspace selected");

    await deleteCollectionApi(workspaceId, id);

    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
      activeCollection:
        state.activeCollection?.id === id ? null : state.activeCollection,
    }));
  },

  duplicateCollection: async (collectionId: string) => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
    if (!workspaceId) throw new Error("No workspace selected");

    const collection = get().collections.find((c) => c.id === collectionId);
    if (!collection) throw new Error("Collection not found");

    // Create a copy with new ID and "(Copy)" suffix
    const duplicatedCollection = await createCollectionApi(
      workspaceId,
      `${collection.name} (Copy)`,
      collection.description
    );

    // Deep clone items with new IDs
    const clonedItems = collection.items.map((item) => {
      return regenerateItemIds(item);
    });

    // Update with cloned items
    const updated = { ...duplicatedCollection, items: clonedItems };
    await updateCollectionApi(workspaceId, updated);

    set((state) => ({
      collections: [...state.collections, updated],
    }));
  },

  setActiveCollection: (collection) => {
    set({ activeCollection: collection });
  },

  setSelectedRequest: (request) => {
    set({ selectedRequest: request });
  },

  addRequestToCollection: async (collectionId: string, request: HttpRequest) => {
    const collection = get().collections.find((c) => c.id === collectionId);
    if (!collection) throw new Error("Collection not found");

    const updatedItems: CollectionItem[] = [
      ...collection.items,
      toRequestCollectionItem(request),
    ];
    await get().updateCollection(collectionId, { items: updatedItems });
  },

  updateRequestInCollection: async (collectionId: string, request: HttpRequest) => {
    const collection = get().collections.find((c) => c.id === collectionId);
    if (!collection) throw new Error("Collection not found");

    const updatedItems = collection.items.map((item) => {
      const itemId = 'id' in item ? item.id : '';
      if (itemId === request.id) {
        return toRequestCollectionItem(request);
      }
      return item;
    });
    await get().updateCollection(collectionId, { items: updatedItems });
  },

  deleteRequestFromCollection: async (collectionId: string, requestId: string) => {
    const collection = get().collections.find((c) => c.id === collectionId);
    if (!collection) throw new Error("Collection not found");

    const updatedItems = collection.items.filter((item) => {
      // Handle both HttpRequest and RequestCollectionItem
      const itemId = 'id' in item ? item.id : '';
      return itemId !== requestId;
    });
    await get().updateCollection(collectionId, { items: updatedItems });
  },

  duplicateRequest: async (collectionId: string, requestId: string) => {
    const collection = get().collections.find((c) => c.id === collectionId);
    if (!collection) throw new Error("Collection not found");

    const requestItem = collection.items.find((item) => {
      const itemId = 'id' in item ? item.id : '';
      return itemId === requestId && 'method' in item;
    }) as HttpRequest | undefined;

    if (!requestItem) {
      throw new Error("Request not found");
    }

    // Create a copy with new ID and "(Copy)" suffix
    const duplicatedRequest: HttpRequest = {
      ...requestItem,
      id: crypto.randomUUID(),
      name: requestItem.name ? `${requestItem.name} (Copy)` : "(Copy)",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedItems: CollectionItem[] = [
      ...collection.items,
      toRequestCollectionItem(duplicatedRequest),
    ];
    await get().updateCollection(collectionId, { items: updatedItems });
  },

  moveRequest: async (
    _declaredSourceCollectionId: string,
    requestId: string,
    targetCollectionId: string,
    targetIndex?: number
  ) => {
    const collections = get().collections;
    const targetCollection = collections.find((c) => c.id === targetCollectionId);
    if (!targetCollection) {
      throw new Error("Target collection not found");
    }

    const owned = findOwningCollectionForRequest(collections, requestId);
    if (!owned) {
      throw new Error("Request not found in any collection");
    }

    const resolvedSourceId = owned.collection.id;
    const requestToMove = owned.item;

    if (resolvedSourceId === targetCollectionId) {
      const without = owned.collection.items.filter((item) => {
        const itemId = "id" in item ? item.id : "";
        return itemId !== requestId;
      });
      let insertAt = targetIndex ?? without.length;
      insertAt = Math.max(0, Math.min(insertAt, without.length));
      const reordered = [...without];
      reordered.splice(insertAt, 0, requestToMove);
      await get().updateCollection(resolvedSourceId, { items: reordered });
      return;
    }

    // Remove from source collection (actual owner, not necessarily the drag payload collection)
    const sourceItems = owned.collection.items.filter((item) => {
      const itemId = 'id' in item ? item.id : '';
      return itemId !== requestId;
    });

    // Add to target collection at specified index
    const targetItems = [...targetCollection.items];
    const insertIndex = targetIndex ?? targetItems.length;
    targetItems.splice(insertIndex, 0, requestToMove);

    // Update both collections
    await get().updateCollection(resolvedSourceId, { items: sourceItems });
    await get().updateCollection(targetCollectionId, { items: targetItems });
  },
}));

// Re-export types
export type { Collection, HttpRequest };

// Helper function to regenerate IDs for duplicated items
function regenerateItemIds(item: CollectionItem): CollectionItem {
  const now = new Date().toISOString();
  const newId = crypto.randomUUID();

  if ("method" in item) {
    // It's a request
    return {
      ...item,
      id: newId,
      createdAt: now,
      updatedAt: now,
    } as CollectionItem;
  } else {
    // It's a nested collection
    return {
      ...item,
      id: newId,
      items: item.items?.map(regenerateItemIds) || [],
      createdAt: now,
      updatedAt: now,
    } as CollectionItem;
  }
}

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
  setActiveCollection: (collection: Collection | null) => void;
  setSelectedRequest: (request: HttpRequest | null) => void;
  addRequestToCollection: (collectionId: string, request: HttpRequest) => Promise<void>;
  deleteRequestFromCollection: (collectionId: string, requestId: string) => Promise<void>;
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
}));

// Re-export types
export type { Collection, HttpRequest };

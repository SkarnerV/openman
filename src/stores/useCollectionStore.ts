import { create } from "zustand";
import { HttpRequest } from "./useRequestStore";

export interface Collection {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  auth?: AuthConfig;
  variables: Variable[];
  items: CollectionItem[];
  createdAt: string;
  updatedAt: string;
}

export type CollectionItem = HttpRequest | Collection;

export interface Variable {
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "secret";
  description?: string;
  enabled: boolean;
}

export type AuthConfig =
  | { type: "none" }
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | { type: "api-key"; key: string; value: string; addTo: "header" | "query" };

interface CollectionState {
  collections: Collection[];
  activeCollection: Collection | null;
  selectedRequest: HttpRequest | null;
  isLoading: boolean;
  error: string | null;
  setCollections: (collections: Collection[]) => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  removeCollection: (id: string) => void;
  setActiveCollection: (collection: Collection | null) => void;
  setSelectedRequest: (request: HttpRequest | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  collections: [],
  activeCollection: null,
  selectedRequest: null,
  isLoading: false,
  error: null,
  setCollections: (collections) => set({ collections }),
  addCollection: (collection) =>
    set((state) => ({
      collections: [...state.collections, collection],
    })),
  updateCollection: (id, updates) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
      activeCollection:
        state.activeCollection?.id === id
          ? { ...state.activeCollection, ...updates }
          : state.activeCollection,
    })),
  removeCollection: (id) =>
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
      activeCollection:
        state.activeCollection?.id === id ? null : state.activeCollection,
    })),
  setActiveCollection: (collection) => set({ activeCollection: collection }),
  setSelectedRequest: (request) => set({ selectedRequest: request }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

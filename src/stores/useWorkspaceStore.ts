import { create } from "zustand";
import {
  getDefaultWorkspace,
  getWorkspaces,
  createWorkspace as createWorkspaceApi,
  type Workspace,
} from "../services/storageService";

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  loadWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;

    set({ isLoading: true, error: null });
    try {
      const workspace = await getDefaultWorkspace();
      set({
        currentWorkspace: workspace,
        isLoading: false,
        initialized: true,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load workspace",
        isLoading: false,
      });
    }
  },

  loadWorkspaces: async () => {
    try {
      const workspaces = await getWorkspaces();
      set({ workspaces });
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    }
  },

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
  },

  createWorkspace: async (name: string, description?: string) => {
    const workspace = await createWorkspaceApi(name, description);
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
    }));
    return workspace;
  },
}));

// Export type for use in other stores
export type { Workspace };
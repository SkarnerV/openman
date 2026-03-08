import { create } from "zustand";

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  theme: "light" | "dark" | "system";
  fontSize: number;
  tabSize: number;
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (id: string) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWorkspace: null,
  isLoading: false,
  error: null,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  addWorkspace: (workspace) =>
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
    })),
  removeWorkspace: (id) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      activeWorkspace:
        state.activeWorkspace?.id === id ? null : state.activeWorkspace,
    })),
  updateWorkspace: (id, updates) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, ...updates } : w,
      ),
      activeWorkspace:
        state.activeWorkspace?.id === id
          ? { ...state.activeWorkspace, ...updates }
          : state.activeWorkspace,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

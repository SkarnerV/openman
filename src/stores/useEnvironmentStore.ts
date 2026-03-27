import { create } from "zustand";
import {
  getEnvironments,
  createEnvironment as createEnvironmentApi,
  updateEnvironment as updateEnvironmentApi,
  deleteEnvironment as deleteEnvironmentApi,
  setActiveEnvironment as setActiveEnvironmentApi,
  type Environment,
  type EnvironmentVariable,
} from "../services/storageService";
import { useWorkspaceStore } from "./useWorkspaceStore";

interface EnvironmentState {
  environments: Environment[];
  activeEnvironment: Environment | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;

  // Actions
  loadEnvironments: () => Promise<void>;
  createEnvironment: (name: string) => Promise<Environment>;
  updateEnvironment: (id: string, updates: Partial<Environment>) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  setActiveEnvironment: (environment: Environment | null) => Promise<void>;
  addVariable: (environmentId: string, variable: EnvironmentVariable) => Promise<void>;
  updateVariable: (environmentId: string, index: number, variable: Partial<EnvironmentVariable>) => Promise<void>;
  deleteVariable: (environmentId: string, index: number) => Promise<void>;
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  environments: [],
  activeEnvironment: null,
  isLoading: false,
  error: null,
  initialized: false,

  loadEnvironments: async () => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
    if (!workspaceId) {
      console.warn("No workspace selected");
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const environments = await getEnvironments(workspaceId);
      const activeEnv = environments.find((e) => e.isActive) || null;
      set({ environments, activeEnvironment: activeEnv, isLoading: false, initialized: true });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load environments",
        isLoading: false,
      });
    }
  },

  createEnvironment: async (name: string) => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
    if (!workspaceId) throw new Error("No workspace selected");

    const environment = await createEnvironmentApi(workspaceId, name);
    set((state) => ({
      environments: [...state.environments, environment],
    }));
    return environment;
  },

  updateEnvironment: async (id: string, updates: Partial<Environment>) => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
    if (!workspaceId) throw new Error("No workspace selected");

    const environment = get().environments.find((e) => e.id === id);
    if (!environment) throw new Error("Environment not found");

    const updatedEnvironment = { ...environment, ...updates, updatedAt: new Date().toISOString() };
    await updateEnvironmentApi(workspaceId, updatedEnvironment);

    set((state) => ({
      environments: state.environments.map((e) =>
        e.id === id ? updatedEnvironment : e
      ),
      activeEnvironment:
        state.activeEnvironment?.id === id ? updatedEnvironment : state.activeEnvironment,
    }));
  },

  deleteEnvironment: async (id: string) => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
    if (!workspaceId) throw new Error("No workspace selected");

    await deleteEnvironmentApi(workspaceId, id);

    set((state) => ({
      environments: state.environments.filter((e) => e.id !== id),
      activeEnvironment:
        state.activeEnvironment?.id === id ? null : state.activeEnvironment,
    }));
  },

  setActiveEnvironment: async (environment: Environment | null) => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
    if (!workspaceId) throw new Error("No workspace selected");

    await setActiveEnvironmentApi(workspaceId, environment?.id || null);

    // Update local state
    set((state) => ({
      environments: state.environments.map((e) => ({
        ...e,
        is_active: e.id === environment?.id,
      })),
      activeEnvironment: environment,
    }));
  },

  addVariable: async (environmentId: string, variable: EnvironmentVariable) => {
    const environment = get().environments.find((e) => e.id === environmentId);
    if (!environment) throw new Error("Environment not found");

    const updatedVariables = [...environment.variables, variable];
    await get().updateEnvironment(environmentId, { variables: updatedVariables });
  },

  updateVariable: async (environmentId: string, index: number, updates: Partial<EnvironmentVariable>) => {
    const environment = get().environments.find((e) => e.id === environmentId);
    if (!environment) throw new Error("Environment not found");

    const updatedVariables = environment.variables.map((v, i) =>
      i === index ? { ...v, ...updates } : v
    );
    await get().updateEnvironment(environmentId, { variables: updatedVariables });
  },

  deleteVariable: async (environmentId: string, index: number) => {
    const environment = get().environments.find((e) => e.id === environmentId);
    if (!environment) throw new Error("Environment not found");

    const updatedVariables = environment.variables.filter((_, i) => i !== index);
    await get().updateEnvironment(environmentId, { variables: updatedVariables });
  },
}));

// Re-export types
export type { Environment, EnvironmentVariable };
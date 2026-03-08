import { create } from "zustand";

export interface Environment {
  id: string;
  name: string;
  isActive: boolean;
  variables: EnvironmentVariable[];
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

interface EnvironmentState {
  environments: Environment[];
  activeEnvironment: Environment | null;
  isLoading: boolean;
  error: string | null;
  setEnvironments: (environments: Environment[]) => void;
  addEnvironment: (environment: Environment) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  removeEnvironment: (id: string) => void;
  setActiveEnvironment: (environment: Environment | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set) => ({
  environments: [],
  activeEnvironment: null,
  isLoading: false,
  error: null,
  setEnvironments: (environments) => set({ environments }),
  addEnvironment: (environment) =>
    set((state) => ({
      environments: [...state.environments, environment],
    })),
  updateEnvironment: (id, updates) =>
    set((state) => ({
      environments: state.environments.map((e) =>
        e.id === id ? { ...e, ...updates } : e,
      ),
      activeEnvironment:
        state.activeEnvironment?.id === id
          ? { ...state.activeEnvironment, ...updates }
          : state.activeEnvironment,
    })),
  removeEnvironment: (id) =>
    set((state) => ({
      environments: state.environments.filter((e) => e.id !== id),
      activeEnvironment:
        state.activeEnvironment?.id === id ? null : state.activeEnvironment,
    })),
  setActiveEnvironment: (environment) =>
    set({ activeEnvironment: environment }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

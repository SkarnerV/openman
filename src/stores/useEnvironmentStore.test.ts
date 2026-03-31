import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEnvironmentStore } from "./useEnvironmentStore";
import { useWorkspaceStore } from "./useWorkspaceStore";

const {
  getEnvironmentsMock,
  createEnvironmentMock,
  updateEnvironmentMock,
  deleteEnvironmentMock,
  setActiveEnvironmentMock,
} = vi.hoisted(() => ({
  getEnvironmentsMock: vi.fn(),
  createEnvironmentMock: vi.fn(),
  updateEnvironmentMock: vi.fn(),
  deleteEnvironmentMock: vi.fn(),
  setActiveEnvironmentMock: vi.fn(),
}));

vi.mock("../services/storageService", () => ({
  getEnvironments: getEnvironmentsMock,
  createEnvironment: createEnvironmentMock,
  updateEnvironment: updateEnvironmentMock,
  deleteEnvironment: deleteEnvironmentMock,
  setActiveEnvironment: setActiveEnvironmentMock,
}));

describe("useEnvironmentStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useWorkspaceStore.setState({
      currentWorkspace: {
        id: "workspace-1",
        name: "Default",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        settings: {
          theme: "dark",
          fontSize: 14,
          tabSize: 2,
        },
      },
    });

    useEnvironmentStore.setState({
      environments: [],
      activeEnvironment: null,
      isLoading: false,
      error: null,
      initialized: false,
    });
  });

  describe("loadEnvironments", () => {
    it("loads environments from the API", async () => {
      const mockEnvironments = [
        {
          id: "env-1",
          name: "Development",
          isActive: true,
          variables: [{ key: "BASE_URL", value: "http://localhost:3000", enabled: true }],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "env-2",
          name: "Production",
          isActive: false,
          variables: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      getEnvironmentsMock.mockResolvedValue(mockEnvironments);

      await useEnvironmentStore.getState().loadEnvironments();

      expect(getEnvironmentsMock).toHaveBeenCalledWith("workspace-1");
      expect(useEnvironmentStore.getState().environments).toEqual(mockEnvironments);
      expect(useEnvironmentStore.getState().activeEnvironment).toEqual(mockEnvironments[0]);
      expect(useEnvironmentStore.getState().initialized).toBe(true);
    });

    it("returns early if no workspace is selected", async () => {
      useWorkspaceStore.setState({ currentWorkspace: null });

      await useEnvironmentStore.getState().loadEnvironments();

      expect(getEnvironmentsMock).not.toHaveBeenCalled();
    });

    it("sets active environment to null if none is active", async () => {
      const mockEnvironments = [
        {
          id: "env-1",
          name: "Development",
          isActive: false,
          variables: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      getEnvironmentsMock.mockResolvedValue(mockEnvironments);

      await useEnvironmentStore.getState().loadEnvironments();

      expect(useEnvironmentStore.getState().activeEnvironment).toBeNull();
    });

    it("handles load errors", async () => {
      getEnvironmentsMock.mockRejectedValue(new Error("Network error"));

      await useEnvironmentStore.getState().loadEnvironments();

      expect(useEnvironmentStore.getState().error).toBe("Network error");
      expect(useEnvironmentStore.getState().isLoading).toBe(false);
    });

    it("handles non-Error errors", async () => {
      getEnvironmentsMock.mockRejectedValue("String error");

      await useEnvironmentStore.getState().loadEnvironments();

      expect(useEnvironmentStore.getState().error).toBe("Failed to load environments");
    });
  });

  describe("createEnvironment", () => {
    it("creates a new environment", async () => {
      const newEnv = {
        id: "env-new",
        name: "Staging",
        isActive: false,
        variables: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      createEnvironmentMock.mockResolvedValue(newEnv);

      const result = await useEnvironmentStore.getState().createEnvironment("Staging");

      expect(createEnvironmentMock).toHaveBeenCalledWith("workspace-1", "Staging");
      expect(result).toEqual(newEnv);
      expect(useEnvironmentStore.getState().environments).toContainEqual(newEnv);
    });

    it("throws if no workspace is selected", async () => {
      useWorkspaceStore.setState({ currentWorkspace: null });

      await expect(
        useEnvironmentStore.getState().createEnvironment("Test")
      ).rejects.toThrow("No workspace selected");
    });
  });

  describe("updateEnvironment", () => {
    beforeEach(() => {
      useEnvironmentStore.setState({
        environments: [
          {
            id: "env-1",
            name: "Development",
            isActive: true,
            variables: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
        activeEnvironment: {
          id: "env-1",
          name: "Development",
          isActive: true,
          variables: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      });
    });

    it("updates an environment", async () => {
      updateEnvironmentMock.mockResolvedValue(undefined);

      await useEnvironmentStore.getState().updateEnvironment("env-1", { name: "Dev Updated" });

      expect(updateEnvironmentMock).toHaveBeenCalled();
      expect(useEnvironmentStore.getState().environments[0].name).toBe("Dev Updated");
    });

    it("updates activeEnvironment if it matches", async () => {
      updateEnvironmentMock.mockResolvedValue(undefined);

      await useEnvironmentStore.getState().updateEnvironment("env-1", { name: "Dev Updated" });

      expect(useEnvironmentStore.getState().activeEnvironment?.name).toBe("Dev Updated");
    });

    it("throws if no workspace is selected", async () => {
      useWorkspaceStore.setState({ currentWorkspace: null });

      await expect(
        useEnvironmentStore.getState().updateEnvironment("env-1", { name: "Test" })
      ).rejects.toThrow("No workspace selected");
    });

    it("throws if environment not found", async () => {
      await expect(
        useEnvironmentStore.getState().updateEnvironment("non-existent", { name: "Test" })
      ).rejects.toThrow("Environment not found");
    });
  });

  describe("deleteEnvironment", () => {
    beforeEach(() => {
      useEnvironmentStore.setState({
        environments: [
          {
            id: "env-1",
            name: "Development",
            isActive: true,
            variables: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
          {
            id: "env-2",
            name: "Production",
            isActive: false,
            variables: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
        activeEnvironment: {
          id: "env-1",
          name: "Development",
          isActive: true,
          variables: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      });
    });

    it("deletes an environment", async () => {
      deleteEnvironmentMock.mockResolvedValue(undefined);

      await useEnvironmentStore.getState().deleteEnvironment("env-2");

      expect(deleteEnvironmentMock).toHaveBeenCalledWith("workspace-1", "env-2");
      expect(useEnvironmentStore.getState().environments).toHaveLength(1);
    });

    it("clears activeEnvironment if deleted", async () => {
      deleteEnvironmentMock.mockResolvedValue(undefined);

      await useEnvironmentStore.getState().deleteEnvironment("env-1");

      expect(useEnvironmentStore.getState().activeEnvironment).toBeNull();
    });

    it("throws if no workspace is selected", async () => {
      useWorkspaceStore.setState({ currentWorkspace: null });

      await expect(
        useEnvironmentStore.getState().deleteEnvironment("env-1")
      ).rejects.toThrow("No workspace selected");
    });
  });

  describe("setActiveEnvironment", () => {
    beforeEach(() => {
      useEnvironmentStore.setState({
        environments: [
          {
            id: "env-1",
            name: "Development",
            isActive: true,
            variables: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
          {
            id: "env-2",
            name: "Production",
            isActive: false,
            variables: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      });
    });

    it("sets the active environment", async () => {
      setActiveEnvironmentMock.mockResolvedValue(undefined);
      const prodEnv = useEnvironmentStore.getState().environments[1];

      await useEnvironmentStore.getState().setActiveEnvironment(prodEnv);

      expect(setActiveEnvironmentMock).toHaveBeenCalledWith("workspace-1", "env-2");
      expect(useEnvironmentStore.getState().activeEnvironment?.id).toBe("env-2");
    });

    it("updates isActive flags on all environments", async () => {
      setActiveEnvironmentMock.mockResolvedValue(undefined);
      const prodEnv = useEnvironmentStore.getState().environments[1];

      await useEnvironmentStore.getState().setActiveEnvironment(prodEnv);

      const envs = useEnvironmentStore.getState().environments;
      expect(envs[0].isActive).toBe(false);
      expect(envs[1].isActive).toBe(true);
    });

    it("can set active environment to null", async () => {
      setActiveEnvironmentMock.mockResolvedValue(undefined);

      await useEnvironmentStore.getState().setActiveEnvironment(null);

      expect(setActiveEnvironmentMock).toHaveBeenCalledWith("workspace-1", null);
      expect(useEnvironmentStore.getState().activeEnvironment).toBeNull();
    });

    it("throws if no workspace is selected", async () => {
      useWorkspaceStore.setState({ currentWorkspace: null });

      await expect(
        useEnvironmentStore.getState().setActiveEnvironment(null)
      ).rejects.toThrow("No workspace selected");
    });
  });

  describe("addVariable", () => {
    beforeEach(() => {
      useEnvironmentStore.setState({
        environments: [
          {
            id: "env-1",
            name: "Development",
            isActive: true,
            variables: [{ key: "BASE_URL", value: "http://localhost:3000", enabled: true }],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      });
      updateEnvironmentMock.mockResolvedValue(undefined);
    });

    it("adds a variable to an environment", async () => {
      await useEnvironmentStore.getState().addVariable("env-1", {
        key: "API_KEY",
        value: "secret",
        enabled: true,
      });

      const env = useEnvironmentStore.getState().environments[0];
      expect(env.variables).toHaveLength(2);
      expect(env.variables[1].key).toBe("API_KEY");
    });

    it("throws if environment not found", async () => {
      await expect(
        useEnvironmentStore.getState().addVariable("non-existent", {
          key: "API_KEY",
          value: "secret",
          enabled: true,
        })
      ).rejects.toThrow("Environment not found");
    });
  });

  describe("updateVariable", () => {
    beforeEach(() => {
      useEnvironmentStore.setState({
        environments: [
          {
            id: "env-1",
            name: "Development",
            isActive: true,
            variables: [
              { key: "BASE_URL", value: "http://localhost:3000", enabled: true },
              { key: "API_KEY", value: "old-key", enabled: true },
            ],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      });
      updateEnvironmentMock.mockResolvedValue(undefined);
    });

    it("updates a variable at a specific index", async () => {
      await useEnvironmentStore.getState().updateVariable("env-1", 1, { value: "new-key" });

      const env = useEnvironmentStore.getState().environments[0];
      expect(env.variables[1].value).toBe("new-key");
    });

    it("throws if environment not found", async () => {
      await expect(
        useEnvironmentStore.getState().updateVariable("non-existent", 0, { value: "test" })
      ).rejects.toThrow("Environment not found");
    });
  });

  describe("deleteVariable", () => {
    beforeEach(() => {
      useEnvironmentStore.setState({
        environments: [
          {
            id: "env-1",
            name: "Development",
            isActive: true,
            variables: [
              { key: "BASE_URL", value: "http://localhost:3000", enabled: true },
              { key: "API_KEY", value: "secret", enabled: true },
            ],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      });
      updateEnvironmentMock.mockResolvedValue(undefined);
    });

    it("deletes a variable at a specific index", async () => {
      await useEnvironmentStore.getState().deleteVariable("env-1", 1);

      const env = useEnvironmentStore.getState().environments[0];
      expect(env.variables).toHaveLength(1);
      expect(env.variables[0].key).toBe("BASE_URL");
    });

    it("throws if environment not found", async () => {
      await expect(
        useEnvironmentStore.getState().deleteVariable("non-existent", 0)
      ).rejects.toThrow("Environment not found");
    });
  });
});
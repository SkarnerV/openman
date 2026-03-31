import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceStore } from "./useWorkspaceStore";

const {
  getDefaultWorkspaceMock,
  getWorkspacesMock,
  createWorkspaceMock,
} = vi.hoisted(() => ({
  getDefaultWorkspaceMock: vi.fn(),
  getWorkspacesMock: vi.fn(),
  createWorkspaceMock: vi.fn(),
}));

vi.mock("../services/storageService", () => ({
  getDefaultWorkspace: getDefaultWorkspaceMock,
  getWorkspaces: getWorkspacesMock,
  createWorkspace: createWorkspaceMock,
}));

describe("useWorkspaceStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useWorkspaceStore.setState({
      workspaces: [],
      currentWorkspace: null,
      isLoading: false,
      error: null,
      initialized: false,
    });
  });

  describe("initialize", () => {
    it("initializes with the default workspace", async () => {
      const mockWorkspace = {
        id: "workspace-1",
        name: "Default Workspace",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        settings: {
          theme: "dark",
          fontSize: 14,
          tabSize: 2,
        },
      };

      getDefaultWorkspaceMock.mockResolvedValue(mockWorkspace);

      await useWorkspaceStore.getState().initialize();

      expect(getDefaultWorkspaceMock).toHaveBeenCalled();
      expect(useWorkspaceStore.getState().currentWorkspace).toEqual(mockWorkspace);
      expect(useWorkspaceStore.getState().initialized).toBe(true);
      expect(useWorkspaceStore.getState().isLoading).toBe(false);
    });

    it("does not re-initialize if already initialized", async () => {
      useWorkspaceStore.setState({ initialized: true });

      await useWorkspaceStore.getState().initialize();

      expect(getDefaultWorkspaceMock).not.toHaveBeenCalled();
    });

    it("handles initialization errors", async () => {
      getDefaultWorkspaceMock.mockRejectedValue(new Error("Disk error"));

      await useWorkspaceStore.getState().initialize();

      expect(useWorkspaceStore.getState().error).toBe("Disk error");
      expect(useWorkspaceStore.getState().isLoading).toBe(false);
    });

    it("handles non-Error initialization errors", async () => {
      getDefaultWorkspaceMock.mockRejectedValue("String error");

      await useWorkspaceStore.getState().initialize();

      expect(useWorkspaceStore.getState().error).toBe("Failed to load workspace");
    });
  });

  describe("loadWorkspaces", () => {
    it("loads all workspaces", async () => {
      const mockWorkspaces = [
        {
          id: "workspace-1",
          name: "Default",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          settings: { theme: "dark", fontSize: 14, tabSize: 2 },
        },
        {
          id: "workspace-2",
          name: "Personal",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          settings: { theme: "light", fontSize: 16, tabSize: 4 },
        },
      ];

      getWorkspacesMock.mockResolvedValue(mockWorkspaces);

      await useWorkspaceStore.getState().loadWorkspaces();

      expect(getWorkspacesMock).toHaveBeenCalled();
      expect(useWorkspaceStore.getState().workspaces).toEqual(mockWorkspaces);
    });

    it("handles load errors silently", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      getWorkspacesMock.mockRejectedValue(new Error("Network error"));

      await useWorkspaceStore.getState().loadWorkspaces();

      expect(consoleSpy).toHaveBeenCalledWith("Failed to load workspaces:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("setCurrentWorkspace", () => {
    it("sets the current workspace", () => {
      const workspace = {
        id: "workspace-2",
        name: "Personal",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        settings: { theme: "light", fontSize: 16, tabSize: 4 },
      };

      useWorkspaceStore.getState().setCurrentWorkspace(workspace);

      expect(useWorkspaceStore.getState().currentWorkspace).toEqual(workspace);
    });
  });

  describe("createWorkspace", () => {
    it("creates a new workspace", async () => {
      const newWorkspace = {
        id: "workspace-new",
        name: "Test Workspace",
        description: "Test description",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        settings: { theme: "dark", fontSize: 14, tabSize: 2 },
      };

      createWorkspaceMock.mockResolvedValue(newWorkspace);

      const result = await useWorkspaceStore.getState().createWorkspace("Test Workspace", "Test description");

      expect(createWorkspaceMock).toHaveBeenCalledWith("Test Workspace", "Test description");
      expect(result).toEqual(newWorkspace);
      expect(useWorkspaceStore.getState().workspaces).toContainEqual(newWorkspace);
    });

    it("creates a workspace without description", async () => {
      const newWorkspace = {
        id: "workspace-new",
        name: "Test Workspace",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        settings: { theme: "dark", fontSize: 14, tabSize: 2 },
      };

      createWorkspaceMock.mockResolvedValue(newWorkspace);

      await useWorkspaceStore.getState().createWorkspace("Test Workspace");

      expect(createWorkspaceMock).toHaveBeenCalledWith("Test Workspace", undefined);
    });
  });
});
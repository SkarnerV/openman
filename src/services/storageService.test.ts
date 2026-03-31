import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getWorkspaces,
  getDefaultWorkspace,
  createWorkspace,
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  getEnvironments,
  getEnvironment,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
  setActiveEnvironment,
  importPostmanCollection,
  exportPostmanCollection,
  toRequestCollectionItem,
} from "./storageService";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

describe("storageService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toRequestCollectionItem", () => {
    it("wraps a request with type: request", () => {
      const request = {
        id: "req-1",
        name: "Get Users",
        method: "GET" as const,
        url: "https://api.example.com/users",
        headers: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = toRequestCollectionItem(request);

      expect(result).toEqual({
        type: "request",
        ...request,
      });
    });
  });

  describe("Workspace operations", () => {
    describe("getWorkspaces", () => {
      it("calls get_workspaces command", async () => {
        const mockWorkspaces = [
          {
            id: "ws-1",
            name: "Default",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
            settings: { theme: "dark", fontSize: 14, tabSize: 2 },
          },
        ];

        invokeMock.mockResolvedValue(mockWorkspaces);

        const result = await getWorkspaces();

        expect(invokeMock).toHaveBeenCalledWith("get_workspaces");
        expect(result).toEqual(mockWorkspaces);
      });
    });

    describe("getDefaultWorkspace", () => {
      it("calls get_default_workspace command", async () => {
        const mockWorkspace = {
          id: "ws-1",
          name: "Default",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          settings: { theme: "dark", fontSize: 14, tabSize: 2 },
        };

        invokeMock.mockResolvedValue(mockWorkspace);

        const result = await getDefaultWorkspace();

        expect(invokeMock).toHaveBeenCalledWith("get_default_workspace");
        expect(result).toEqual(mockWorkspace);
      });
    });

    describe("createWorkspace", () => {
      it("calls create_workspace command with name and description", async () => {
        const mockWorkspace = {
          id: "ws-new",
          name: "New Workspace",
          description: "Test",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          settings: { theme: "dark", fontSize: 14, tabSize: 2 },
        };

        invokeMock.mockResolvedValue(mockWorkspace);

        const result = await createWorkspace("New Workspace", "Test");

        expect(invokeMock).toHaveBeenCalledWith("create_workspace", {
          name: "New Workspace",
          description: "Test",
        });
        expect(result).toEqual(mockWorkspace);
      });

      it("calls create_workspace command without description", async () => {
        const mockWorkspace = {
          id: "ws-new",
          name: "New Workspace",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          settings: { theme: "dark", fontSize: 14, tabSize: 2 },
        };

        invokeMock.mockResolvedValue(mockWorkspace);

        await createWorkspace("New Workspace");

        expect(invokeMock).toHaveBeenCalledWith("create_workspace", {
          name: "New Workspace",
          description: undefined,
        });
      });
    });
  });

  describe("Collection operations", () => {
    describe("getCollections", () => {
      it("calls get_collections command with workspaceId", async () => {
        const mockCollections = [
          {
            id: "col-1",
            name: "Users API",
            variables: [],
            items: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ];

        invokeMock.mockResolvedValue(mockCollections);

        const result = await getCollections("workspace-1");

        expect(invokeMock).toHaveBeenCalledWith("get_collections", {
          workspaceId: "workspace-1",
        });
        expect(result).toEqual(mockCollections);
      });
    });

    describe("getCollection", () => {
      it("calls get_collection command with workspaceId and collectionId", async () => {
        const mockCollection = {
          id: "col-1",
          name: "Users API",
          variables: [],
          items: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        invokeMock.mockResolvedValue(mockCollection);

        const result = await getCollection("workspace-1", "col-1");

        expect(invokeMock).toHaveBeenCalledWith("get_collection", {
          workspaceId: "workspace-1",
          collectionId: "col-1",
        });
        expect(result).toEqual(mockCollection);
      });
    });

    describe("createCollection", () => {
      it("calls create_collection command with all parameters", async () => {
        const mockCollection = {
          id: "col-new",
          name: "New API",
          description: "Test collection",
          variables: [],
          items: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        invokeMock.mockResolvedValue(mockCollection);

        const result = await createCollection("workspace-1", "New API", "Test collection");

        expect(invokeMock).toHaveBeenCalledWith("create_collection", {
          workspaceId: "workspace-1",
          name: "New API",
          description: "Test collection",
        });
        expect(result).toEqual(mockCollection);
      });

      it("calls create_collection command without description", async () => {
        const mockCollection = {
          id: "col-new",
          name: "New API",
          variables: [],
          items: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        invokeMock.mockResolvedValue(mockCollection);

        await createCollection("workspace-1", "New API");

        expect(invokeMock).toHaveBeenCalledWith("create_collection", {
          workspaceId: "workspace-1",
          name: "New API",
          description: undefined,
        });
      });
    });

    describe("updateCollection", () => {
      it("calls update_collection command with workspaceId and collection", async () => {
        const mockCollection = {
          id: "col-1",
          name: "Updated API",
          variables: [],
          items: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        invokeMock.mockResolvedValue(undefined);

        await updateCollection("workspace-1", mockCollection);

        expect(invokeMock).toHaveBeenCalledWith("update_collection", {
          workspaceId: "workspace-1",
          collection: mockCollection,
        });
      });
    });

    describe("deleteCollection", () => {
      it("calls delete_collection command with workspaceId and collectionId", async () => {
        invokeMock.mockResolvedValue(undefined);

        await deleteCollection("workspace-1", "col-1");

        expect(invokeMock).toHaveBeenCalledWith("delete_collection", {
          workspaceId: "workspace-1",
          collectionId: "col-1",
        });
      });
    });
  });

  describe("Environment operations", () => {
    describe("getEnvironments", () => {
      it("calls get_environments command with workspaceId", async () => {
        const mockEnvironments = [
          {
            id: "env-1",
            name: "Development",
            isActive: true,
            variables: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ];

        invokeMock.mockResolvedValue(mockEnvironments);

        const result = await getEnvironments("workspace-1");

        expect(invokeMock).toHaveBeenCalledWith("get_environments", {
          workspaceId: "workspace-1",
        });
        expect(result).toEqual(mockEnvironments);
      });
    });

    describe("getEnvironment", () => {
      it("calls get_environment command with workspaceId and environmentId", async () => {
        const mockEnvironment = {
          id: "env-1",
          name: "Development",
          isActive: true,
          variables: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        invokeMock.mockResolvedValue(mockEnvironment);

        const result = await getEnvironment("workspace-1", "env-1");

        expect(invokeMock).toHaveBeenCalledWith("get_environment", {
          workspaceId: "workspace-1",
          environmentId: "env-1",
        });
        expect(result).toEqual(mockEnvironment);
      });
    });

    describe("createEnvironment", () => {
      it("calls create_environment command with workspaceId and name", async () => {
        const mockEnvironment = {
          id: "env-new",
          name: "Staging",
          isActive: false,
          variables: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        invokeMock.mockResolvedValue(mockEnvironment);

        const result = await createEnvironment("workspace-1", "Staging");

        expect(invokeMock).toHaveBeenCalledWith("create_environment", {
          workspaceId: "workspace-1",
          name: "Staging",
        });
        expect(result).toEqual(mockEnvironment);
      });
    });

    describe("updateEnvironment", () => {
      it("calls update_environment command with workspaceId and environment", async () => {
        const mockEnvironment = {
          id: "env-1",
          name: "Development Updated",
          isActive: true,
          variables: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        invokeMock.mockResolvedValue(undefined);

        await updateEnvironment("workspace-1", mockEnvironment);

        expect(invokeMock).toHaveBeenCalledWith("update_environment", {
          workspaceId: "workspace-1",
          environment: mockEnvironment,
        });
      });
    });

    describe("deleteEnvironment", () => {
      it("calls delete_environment command with workspaceId and environmentId", async () => {
        invokeMock.mockResolvedValue(undefined);

        await deleteEnvironment("workspace-1", "env-1");

        expect(invokeMock).toHaveBeenCalledWith("delete_environment", {
          workspaceId: "workspace-1",
          environmentId: "env-1",
        });
      });
    });

    describe("setActiveEnvironment", () => {
      it("calls set_active_environment command with environmentId", async () => {
        invokeMock.mockResolvedValue(undefined);

        await setActiveEnvironment("workspace-1", "env-1");

        expect(invokeMock).toHaveBeenCalledWith("set_active_environment", {
          workspaceId: "workspace-1",
          environmentId: "env-1",
        });
      });

      it("calls set_active_environment command with null", async () => {
        invokeMock.mockResolvedValue(undefined);

        await setActiveEnvironment("workspace-1", null);

        expect(invokeMock).toHaveBeenCalledWith("set_active_environment", {
          workspaceId: "workspace-1",
          environmentId: null,
        });
      });
    });
  });

  describe("Import/Export", () => {
    describe("importPostmanCollection", () => {
      it("calls import_postman_collection command with workspaceId and json", async () => {
        const mockCollection = {
          id: "col-imported",
          name: "Imported Collection",
          variables: [],
          items: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        invokeMock.mockResolvedValue(mockCollection);

        const jsonString = JSON.stringify({ info: { name: "Test" }, item: [] });

        const result = await importPostmanCollection("workspace-1", jsonString);

        expect(invokeMock).toHaveBeenCalledWith("import_postman_collection", {
          workspaceId: "workspace-1",
          json: jsonString,
        });
        expect(result).toEqual(mockCollection);
      });
    });

    describe("exportPostmanCollection", () => {
      it("calls export_postman_collection command with collectionId", async () => {
        const mockExport = JSON.stringify({ info: { name: "Test" }, item: [] });

        invokeMock.mockResolvedValue(mockExport);

        const result = await exportPostmanCollection("col-1");

        expect(invokeMock).toHaveBeenCalledWith("export_postman_collection", {
          collectionId: "col-1",
        });
        expect(result).toBe(mockExport);
      });
    });
  });
});
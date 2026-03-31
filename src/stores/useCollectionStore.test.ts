import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCollectionStore } from "./useCollectionStore";
import { useWorkspaceStore } from "./useWorkspaceStore";

const {
  getCollectionsMock,
  createCollectionMock,
  updateCollectionMock,
  deleteCollectionMock,
} = vi.hoisted(() => ({
  getCollectionsMock: vi.fn(),
  createCollectionMock: vi.fn(),
  updateCollectionMock: vi.fn(),
  deleteCollectionMock: vi.fn(),
}));

vi.mock("../services/storageService", () => ({
  getCollections: getCollectionsMock,
  createCollection: createCollectionMock,
  updateCollection: updateCollectionMock,
  deleteCollection: deleteCollectionMock,
  toRequestCollectionItem: (request: Record<string, unknown>) => ({
    type: "request",
    ...request,
  }),
}));

describe("useCollectionStore", () => {
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

    useCollectionStore.setState({
      collections: [],
      activeCollection: null,
      selectedRequest: null,
      isLoading: false,
      error: null,
      initialized: false,
    });
  });

  describe("loadCollections", () => {
    it("loads collections from the API", async () => {
      const mockCollections = [
        {
          id: "collection-1",
          name: "Users API",
          variables: [],
          items: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      getCollectionsMock.mockResolvedValue(mockCollections);

      await useCollectionStore.getState().loadCollections();

      expect(getCollectionsMock).toHaveBeenCalledWith("workspace-1");
      expect(useCollectionStore.getState().collections).toEqual(mockCollections);
      expect(useCollectionStore.getState().initialized).toBe(true);
    });

    it("returns early if no workspace is selected", async () => {
      useWorkspaceStore.setState({ currentWorkspace: null });

      await useCollectionStore.getState().loadCollections();

      expect(getCollectionsMock).not.toHaveBeenCalled();
    });

    it("handles load errors", async () => {
      getCollectionsMock.mockRejectedValue(new Error("Disk error"));

      await useCollectionStore.getState().loadCollections();

      expect(useCollectionStore.getState().error).toBe("Disk error");
      expect(useCollectionStore.getState().isLoading).toBe(false);
    });

    it("handles non-Error errors", async () => {
      getCollectionsMock.mockRejectedValue("String error");

      await useCollectionStore.getState().loadCollections();

      expect(useCollectionStore.getState().error).toBe("Failed to load collections");
    });
  });

  describe("createCollection", () => {
    it("creates a new collection", async () => {
      const newCollection = {
        id: "collection-new",
        name: "Payment API",
        variables: [],
        items: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      createCollectionMock.mockResolvedValue(newCollection);

      const result = await useCollectionStore.getState().createCollection("Payment API", "Payment endpoints");

      expect(createCollectionMock).toHaveBeenCalledWith("workspace-1", "Payment API", "Payment endpoints");
      expect(result).toEqual(newCollection);
      expect(useCollectionStore.getState().collections).toContainEqual(newCollection);
    });

    it("creates a collection without description", async () => {
      const newCollection = {
        id: "collection-new",
        name: "Payment API",
        variables: [],
        items: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      createCollectionMock.mockResolvedValue(newCollection);

      await useCollectionStore.getState().createCollection("Payment API");

      expect(createCollectionMock).toHaveBeenCalledWith("workspace-1", "Payment API", undefined);
    });

    it("throws if no workspace is selected", async () => {
      useWorkspaceStore.setState({ currentWorkspace: null });

      await expect(
        useCollectionStore.getState().createCollection("Test")
      ).rejects.toThrow("No workspace selected");
    });
  });

  describe("updateCollection", () => {
    beforeEach(() => {
      useCollectionStore.setState({
        collections: [
          {
            id: "collection-1",
            name: "Users API",
            variables: [],
            items: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
        activeCollection: {
          id: "collection-1",
          name: "Users API",
          variables: [],
          items: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      });
    });

    it("updates a collection", async () => {
      updateCollectionMock.mockResolvedValue(undefined);

      await useCollectionStore.getState().updateCollection("collection-1", { name: "Updated API" });

      expect(updateCollectionMock).toHaveBeenCalled();
      expect(useCollectionStore.getState().collections[0].name).toBe("Updated API");
    });

    it("updates activeCollection if it matches", async () => {
      updateCollectionMock.mockResolvedValue(undefined);

      await useCollectionStore.getState().updateCollection("collection-1", { name: "Updated API" });

      expect(useCollectionStore.getState().activeCollection?.name).toBe("Updated API");
    });

    it("throws if no workspace is selected", async () => {
      useWorkspaceStore.setState({ currentWorkspace: null });

      await expect(
        useCollectionStore.getState().updateCollection("collection-1", { name: "Test" })
      ).rejects.toThrow("No workspace selected");
    });

    it("throws if collection not found", async () => {
      await expect(
        useCollectionStore.getState().updateCollection("non-existent", { name: "Test" })
      ).rejects.toThrow("Collection not found");
    });
  });

  describe("deleteCollection", () => {
    beforeEach(() => {
      useCollectionStore.setState({
        collections: [
          {
            id: "collection-1",
            name: "Users API",
            variables: [],
            items: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
        activeCollection: {
          id: "collection-1",
          name: "Users API",
          variables: [],
          items: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      });
    });

    it("deletes a collection", async () => {
      deleteCollectionMock.mockResolvedValue(undefined);

      await useCollectionStore.getState().deleteCollection("collection-1");

      expect(deleteCollectionMock).toHaveBeenCalledWith("workspace-1", "collection-1");
      expect(useCollectionStore.getState().collections).toHaveLength(0);
    });

    it("clears activeCollection if deleted", async () => {
      deleteCollectionMock.mockResolvedValue(undefined);

      await useCollectionStore.getState().deleteCollection("collection-1");

      expect(useCollectionStore.getState().activeCollection).toBeNull();
    });

    it("throws if no workspace is selected", async () => {
      useWorkspaceStore.setState({ currentWorkspace: null });

      await expect(
        useCollectionStore.getState().deleteCollection("collection-1")
      ).rejects.toThrow("No workspace selected");
    });
  });

  describe("setActiveCollection", () => {
    it("sets the active collection", () => {
      const collection = {
        id: "collection-1",
        name: "Users API",
        variables: [],
        items: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      useCollectionStore.getState().setActiveCollection(collection);

      expect(useCollectionStore.getState().activeCollection).toEqual(collection);
    });

    it("can set active collection to null", () => {
      useCollectionStore.setState({
        activeCollection: {
          id: "collection-1",
          name: "Users API",
          variables: [],
          items: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      });

      useCollectionStore.getState().setActiveCollection(null);

      expect(useCollectionStore.getState().activeCollection).toBeNull();
    });
  });

  describe("setSelectedRequest", () => {
    it("sets the selected request", () => {
      const request = {
        id: "req-1",
        name: "Get Users",
        method: "GET" as const,
        url: "https://api.example.com/users",
        headers: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      useCollectionStore.getState().setSelectedRequest(request);

      expect(useCollectionStore.getState().selectedRequest).toEqual(request);
    });
  });

  describe("addRequestToCollection", () => {
    beforeEach(() => {
      useCollectionStore.setState({
        collections: [
          {
            id: "collection-1",
            name: "Users API",
            variables: [],
            items: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      });
      updateCollectionMock.mockResolvedValue(undefined);
    });

    it("adds a request to a collection", async () => {
      const request = {
        id: "req-1",
        name: "Get Users",
        method: "GET" as const,
        url: "https://api.example.com/users",
        headers: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      await useCollectionStore.getState().addRequestToCollection("collection-1", request);

      expect(updateCollectionMock).toHaveBeenCalledWith(
        "workspace-1",
        expect.objectContaining({
          id: "collection-1",
          items: [expect.objectContaining({ type: "request", id: "req-1" })],
        })
      );
    });

    it("throws if collection not found", async () => {
      await expect(
        useCollectionStore.getState().addRequestToCollection("non-existent", {
          id: "req-1",
          name: "Test",
          method: "GET" as const,
          url: "https://example.com",
          headers: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        })
      ).rejects.toThrow("Collection not found");
    });
  });

  describe("updateRequestInCollection", () => {
    beforeEach(() => {
      useCollectionStore.setState({
        collections: [
          {
            id: "collection-1",
            name: "Users API",
            variables: [],
            items: [
              {
                type: "request",
                id: "req-1",
                name: "Get Users",
                method: "GET" as const,
                url: "https://api.example.com/users",
                headers: [],
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              },
            ],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      });
      updateCollectionMock.mockResolvedValue(undefined);
    });

    it("updates a request in a collection", async () => {
      const updatedRequest = {
        id: "req-1",
        name: "Get All Users",
        method: "GET" as const,
        url: "https://api.example.com/users/all",
        headers: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      await useCollectionStore.getState().updateRequestInCollection("collection-1", updatedRequest);

      expect(updateCollectionMock).toHaveBeenCalled();
    });

    it("throws if collection not found", async () => {
      await expect(
        useCollectionStore.getState().updateRequestInCollection("non-existent", {
          id: "req-1",
          name: "Test",
          method: "GET" as const,
          url: "https://example.com",
          headers: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        })
      ).rejects.toThrow("Collection not found");
    });
  });

  describe("deleteRequestFromCollection", () => {
    beforeEach(() => {
      useCollectionStore.setState({
        collections: [
          {
            id: "collection-1",
            name: "Users API",
            variables: [],
            items: [
              {
                type: "request",
                id: "req-1",
                name: "Get Users",
                method: "GET" as const,
                url: "https://api.example.com/users",
                headers: [],
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              },
            ],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      });
      updateCollectionMock.mockResolvedValue(undefined);
    });

    it("deletes a request from a collection", async () => {
      await useCollectionStore.getState().deleteRequestFromCollection("collection-1", "req-1");

      expect(updateCollectionMock).toHaveBeenCalledWith(
        "workspace-1",
        expect.objectContaining({
          id: "collection-1",
          items: [],
        })
      );
    });

    it("throws if collection not found", async () => {
      await expect(
        useCollectionStore.getState().deleteRequestFromCollection("non-existent", "req-1")
      ).rejects.toThrow("Collection not found");
    });
  });

  describe("duplicateRequest", () => {
    beforeEach(() => {
      useCollectionStore.setState({
        collections: [
          {
            id: "collection-1",
            name: "Users API",
            variables: [],
            items: [
              {
                type: "request",
                id: "req-1",
                name: "Get Users",
                method: "GET" as const,
                url: "https://api.example.com/users",
                headers: [],
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              },
            ],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      });
      updateCollectionMock.mockResolvedValue(undefined);
    });

    it("duplicates a request with (Copy) suffix", async () => {
      await useCollectionStore.getState().duplicateRequest("collection-1", "req-1");

      expect(updateCollectionMock).toHaveBeenCalledWith(
        "workspace-1",
        expect.objectContaining({
          id: "collection-1",
          items: expect.arrayContaining([
            expect.objectContaining({ id: "req-1" }),
            expect.objectContaining({ name: "Get Users (Copy)" }),
          ]),
        })
      );
    });

    it("throws if collection not found", async () => {
      await expect(
        useCollectionStore.getState().duplicateRequest("non-existent", "req-1")
      ).rejects.toThrow("Collection not found");
    });

    it("throws if request not found", async () => {
      await expect(
        useCollectionStore.getState().duplicateRequest("collection-1", "non-existent")
      ).rejects.toThrow("Request not found");
    });
  });

  describe("moveRequest", () => {
    beforeEach(() => {
      useCollectionStore.setState({
        collections: [
          {
            id: "collection-1",
            name: "Users API",
            variables: [],
            items: [
              {
                type: "request",
                id: "req-1",
                name: "Get Users",
                method: "GET" as const,
                url: "https://api.example.com/users",
                headers: [],
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              },
            ],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
          {
            id: "collection-2",
            name: "Posts API",
            variables: [],
            items: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      });
      updateCollectionMock.mockResolvedValue(undefined);
    });

    it("moves a request to a different collection", async () => {
      await useCollectionStore.getState().moveRequest("collection-1", "req-1", "collection-2");

      // Should update both collections
      expect(updateCollectionMock).toHaveBeenCalledTimes(2);
    });

    it("reorders a request within the same collection", async () => {
      useCollectionStore.setState({
        collections: [
          {
            id: "collection-1",
            name: "Users API",
            variables: [],
            items: [
              {
                type: "request",
                id: "req-1",
                name: "Get Users",
                method: "GET" as const,
                url: "https://api.example.com/users",
                headers: [],
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              },
              {
                type: "request",
                id: "req-2",
                name: "Create User",
                method: "POST" as const,
                url: "https://api.example.com/users",
                headers: [],
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              },
            ],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      });

      await useCollectionStore.getState().moveRequest("collection-1", "req-1", "collection-1", 1);

      expect(updateCollectionMock).toHaveBeenCalledTimes(1);
    });

    it("throws if target collection not found", async () => {
      await expect(
        useCollectionStore.getState().moveRequest("collection-1", "req-1", "non-existent")
      ).rejects.toThrow("Target collection not found");
    });

    it("throws if request not found in any collection", async () => {
      await expect(
        useCollectionStore.getState().moveRequest("collection-1", "non-existent", "collection-2")
      ).rejects.toThrow("Request not found in any collection");
    });
  });
});
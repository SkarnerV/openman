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
      collections: [
        {
          id: "collection-1",
          name: "Users",
          variables: [],
          items: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ],
      activeCollection: null,
      selectedRequest: null,
      isLoading: false,
      error: null,
      initialized: true,
    });
  });

  it("wraps saved requests with the request collection item tag", async () => {
    await useCollectionStore.getState().addRequestToCollection("collection-1", {
      id: "request-1",
      name: "Get users",
      method: "GET",
      url: "https://api.example.com/users",
      headers: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    expect(updateCollectionMock).toHaveBeenCalledWith(
      "workspace-1",
      expect.objectContaining({
        id: "collection-1",
        items: [
          expect.objectContaining({
            type: "request",
            id: "request-1",
            method: "GET",
          }),
        ],
      })
    );
  });
});

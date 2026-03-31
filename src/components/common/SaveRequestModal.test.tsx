import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SaveRequestModal } from "./SaveRequestModal";
import { useCollectionStore } from "../../stores/useCollectionStore";
import { useRequestStore } from "../../stores/useRequestStore";

const mockOnClose = vi.fn();

describe("SaveRequestModal", () => {
  const mockRequest = {
    id: "1",
    name: "Test Request",
    method: "GET" as const,
    url: "https://api.example.com/users",
    headers: [],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  const mockResponse = {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
    body: '{"success": true}',
    responseTime: 100,
    responseSize: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    useCollectionStore.setState({
      collections: [
        {
          id: "col-1",
          name: "API Collection",
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
      loadCollections: vi.fn(),
      createCollection: vi.fn().mockResolvedValue({
        id: "new-collection-id",
        name: "New Collection",
        variables: [],
        items: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      }),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      setActiveCollection: vi.fn(),
      setSelectedRequest: vi.fn(),
      addRequestToCollection: vi.fn().mockResolvedValue(undefined),
      updateRequestInCollection: vi.fn().mockResolvedValue(undefined),
    });

    useRequestStore.setState({
      currentRequest: null,
      response: null,
      isLoading: false,
      error: null,
      requestHistory: [],
      sourceCollectionId: null,
      sourceRequestId: null,
    });
  });

  it("does not render when isOpen is false", () => {
    render(
      <SaveRequestModal isOpen={false} onClose={mockOnClose} request={mockRequest} />
    );

    expect(screen.queryByRole("heading", { name: "Save Request" })).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    expect(screen.getByRole("heading", { name: "Save Request" })).toBeInTheDocument();
  });

  it("renders Update Request when updating", () => {
    useRequestStore.setState({
      sourceCollectionId: "col-1",
      sourceRequestId: "1",
    });

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    expect(screen.getByRole("heading", { name: "Update Request" })).toBeInTheDocument();
  });

  it("renders request name input", () => {
    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    const nameInput = screen.getByDisplayValue("Test Request");
    expect(nameInput).toBeInTheDocument();
  });

  it("renders collection selector", () => {
    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    expect(screen.getByText("Collection")).toBeInTheDocument();
  });

  it("shows collections in dropdown", () => {
    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    expect(screen.getByText("API Collection")).toBeInTheDocument();
  });

  it("shows new collection form when clicking + New", async () => {
    const user = userEvent.setup();

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    await user.click(screen.getByRole("button", { name: /\+ new/i }));

    expect(screen.getByPlaceholderText(/enter collection name/i)).toBeInTheDocument();
  });

  it("hides new collection form when clicking Cancel button in new collection mode", async () => {
    const user = userEvent.setup();

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    // Show new collection form
    await user.click(screen.getByRole("button", { name: /\+ new/i }));
    expect(screen.getByPlaceholderText(/enter collection name/i)).toBeInTheDocument();

    // Click the Cancel button next to the input (in the new collection form)
    const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
    await user.click(cancelButtons[0]); // First Cancel is in the new collection form

    expect(screen.queryByPlaceholderText(/enter collection name/i)).not.toBeInTheDocument();
  });

  it("renders request preview with method and URL", () => {
    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    expect(screen.getByText("GET")).toBeInTheDocument();
    expect(screen.getByText("https://api.example.com/users")).toBeInTheDocument();
  });

  it("shows correct color for GET method", () => {
    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    const methodElement = screen.getByText("GET");
    expect(methodElement.className).toContain("text-get-method");
  });

  it("shows correct color for POST method", () => {
    const postRequest = { ...mockRequest, method: "POST" as const };

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={postRequest} />
    );

    const methodElement = screen.getByText("POST");
    expect(methodElement.className).toContain("text-post-method");
  });

  it("shows correct color for PUT method", () => {
    const putRequest = { ...mockRequest, method: "PUT" as const };

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={putRequest} />
    );

    const methodElement = screen.getByText("PUT");
    expect(methodElement.className).toContain("text-put-method");
  });

  it("shows correct color for DELETE method", () => {
    const deleteRequest = { ...mockRequest, method: "DELETE" as const };

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={deleteRequest} />
    );

    const methodElement = screen.getByText("DELETE");
    expect(methodElement.className).toContain("text-delete-method");
  });

  it("shows default color for unknown methods", () => {
    const optionsRequest = { ...mockRequest, method: "OPTIONS" as const };

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={optionsRequest} />
    );

    const methodElement = screen.getByText("OPTIONS");
    expect(methodElement.className).toContain("text-text-secondary");
  });

  it("calls onClose when clicking Cancel button", async () => {
    const user = userEvent.setup();

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
    await user.click(cancelButtons[cancelButtons.length - 1]); // Last Cancel is the modal's cancel

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when clicking X button", async () => {
    const user = userEvent.setup();

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    // Find the X button (empty button in the header)
    const headerButtons = screen.getAllByRole("button");
    const xButton = headerButtons.find(btn => btn.querySelector("svg.lucide-x"));
    await user.click(xButton!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows error when saving without request name", async () => {
    const user = userEvent.setup();

    render(
      <SaveRequestModal
        isOpen={true}
        onClose={mockOnClose}
        request={{ ...mockRequest, name: "" }}
      />
    );

    await user.click(screen.getByRole("button", { name: /save request/i }));

    expect(screen.getByText("Please enter a request name")).toBeInTheDocument();
  });

  it("shows error when creating collection without name", async () => {
    const user = userEvent.setup();

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    await user.click(screen.getByRole("button", { name: /\+ new/i }));
    await user.click(screen.getByRole("button", { name: /save request/i }));

    expect(screen.getByText("Please enter a collection name")).toBeInTheDocument();
  });

  it("saves request to existing collection", async () => {
    const user = userEvent.setup();
    const addRequestMock = vi.fn().mockResolvedValue(undefined);

    // Set up store state BEFORE rendering
    useCollectionStore.setState({
      ...useCollectionStore.getState(),
      addRequestToCollection: addRequestMock,
    });

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    await user.click(screen.getByRole("button", { name: /save request/i }));

    await waitFor(() => {
      expect(addRequestMock).toHaveBeenCalled();
      expect(addRequestMock).toHaveBeenCalledWith("col-1", expect.objectContaining({
        name: "Test Request",
      }));
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("saves request with response data", async () => {
    const user = userEvent.setup();
    const addRequestMock = vi.fn().mockResolvedValue(undefined);
    useCollectionStore.setState({
      ...useCollectionStore.getState(),
      addRequestToCollection: addRequestMock,
    });
    useRequestStore.setState({
      ...useRequestStore.getState(),
      response: mockResponse,
    });

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    await user.click(screen.getByRole("button", { name: /save request/i }));

    await waitFor(() => {
      expect(addRequestMock).toHaveBeenCalledWith("col-1", expect.objectContaining({
        lastResponse: mockResponse,
      }));
    });
  });

  it("creates new collection and saves request", async () => {
    const user = userEvent.setup();
    const createCollectionMock = vi.fn().mockResolvedValue({
      id: "new-col-id",
      name: "My New Collection",
      variables: [],
      items: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });
    const addRequestMock = vi.fn().mockResolvedValue(undefined);
    useCollectionStore.setState({
      ...useCollectionStore.getState(),
      createCollection: createCollectionMock,
      addRequestToCollection: addRequestMock,
    });

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    await user.click(screen.getByRole("button", { name: /\+ new/i }));
    await user.type(screen.getByPlaceholderText(/enter collection name/i), "My New Collection");
    await user.click(screen.getByRole("button", { name: /save request/i }));

    await waitFor(() => {
      expect(createCollectionMock).toHaveBeenCalledWith("My New Collection");
      expect(addRequestMock).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("updates existing request", async () => {
    const user = userEvent.setup();
    const updateRequestMock = vi.fn().mockResolvedValue(undefined);
    useCollectionStore.setState({
      ...useCollectionStore.getState(),
      updateRequestInCollection: updateRequestMock,
    });
    useRequestStore.setState({
      ...useRequestStore.getState(),
      sourceCollectionId: "col-1",
      sourceRequestId: "1",
    });

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    await user.click(screen.getByRole("button", { name: /update request/i }));

    await waitFor(() => {
      expect(updateRequestMock).toHaveBeenCalledWith("col-1", expect.objectContaining({
        id: "1",
        name: "Test Request",
      }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("shows loading state while saving", async () => {
    const user = userEvent.setup();
    let resolveSave: () => void;
    const addRequestMock = vi.fn().mockImplementation(() => new Promise<void>((resolve) => {
      resolveSave = resolve;
    }));
    useCollectionStore.setState({
      ...useCollectionStore.getState(),
      addRequestToCollection: addRequestMock,
    });

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    await user.click(screen.getByRole("button", { name: /save request/i }));

    expect(screen.getByText("Saving...")).toBeInTheDocument();

    resolveSave!();
    await waitFor(() => expect(mockOnClose).toHaveBeenCalled());
  });

  it("shows error when save fails", async () => {
    const user = userEvent.setup();
    const addRequestMock = vi.fn().mockRejectedValue(new Error("Network error"));
    useCollectionStore.setState({
      ...useCollectionStore.getState(),
      addRequestToCollection: addRequestMock,
    });

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    await user.click(screen.getByRole("button", { name: /save request/i }));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("handles string errors", async () => {
    const user = userEvent.setup();
    const addRequestMock = vi.fn().mockRejectedValue("String error");
    useCollectionStore.setState({
      ...useCollectionStore.getState(),
      addRequestToCollection: addRequestMock,
    });

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    await user.click(screen.getByRole("button", { name: /save request/i }));

    await waitFor(() => {
      expect(screen.getByText("String error")).toBeInTheDocument();
    });
  });

  it("handles unknown error types", async () => {
    const user = userEvent.setup();
    const addRequestMock = vi.fn().mockRejectedValue({ unknown: "error" });
    useCollectionStore.setState({
      ...useCollectionStore.getState(),
      addRequestToCollection: addRequestMock,
    });

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    await user.click(screen.getByRole("button", { name: /save request/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to save request")).toBeInTheDocument();
    });
  });

  it("submits on Enter key press in name input", async () => {
    const user = userEvent.setup();
    const addRequestMock = vi.fn().mockResolvedValue(undefined);
    useCollectionStore.setState({
      ...useCollectionStore.getState(),
      addRequestToCollection: addRequestMock,
    });

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    await user.type(screen.getByDisplayValue("Test Request"), "{Enter}");

    await waitFor(() => {
      expect(addRequestMock).toHaveBeenCalled();
    });
  });

  it("clears error when typing in name input", async () => {
    const user = userEvent.setup();

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={{ ...mockRequest, name: "" }} />
    );

    // Trigger error
    await user.click(screen.getByRole("button", { name: /save request/i }));
    expect(screen.getByText("Please enter a request name")).toBeInTheDocument();

    // Type to clear error
    await user.type(screen.getByPlaceholderText(/enter request name/i), "Test");
    expect(screen.queryByText("Please enter a request name")).not.toBeInTheDocument();
  });

  it("shows no collections placeholder when empty", () => {
    useCollectionStore.setState({
      ...useCollectionStore.getState(),
      collections: [],
    });

    render(
      <SaveRequestModal isOpen={true} onClose={mockOnClose} request={mockRequest} />
    );

    expect(screen.getByText("No collections")).toBeInTheDocument();
  });
});
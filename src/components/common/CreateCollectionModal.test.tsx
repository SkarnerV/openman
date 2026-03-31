import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateCollectionModal } from "./CreateCollectionModal";

describe("CreateCollectionModal", () => {
  const mockOnClose = vi.fn();
  const mockOnCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when isOpen is true", () => {
    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.getByRole("heading", { name: "Create Collection" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g., My API Collection/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe this collection/)).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(
      <CreateCollectionModal
        isOpen={false}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.queryByRole("heading", { name: "Create Collection" })).not.toBeInTheDocument();
  });

  it("calls onClose when X button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    // Find the close button (X icon button)
    const closeButton = screen.getByRole("button", { name: "" });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows error when submitting empty name", async () => {
    const user = userEvent.setup();
    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    // Click the submit button (use role with name for the button specifically)
    const submitButton = screen.getByRole("button", { name: /Create Collection$/ });
    await user.click(submitButton);

    expect(screen.getByText("Please enter a collection name")).toBeInTheDocument();
    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it("calls onCreate with name and description", async () => {
    mockOnCreate.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    await user.type(screen.getByPlaceholderText(/e.g., My API Collection/), "Test Collection");
    await user.type(screen.getByPlaceholderText(/Describe this collection/), "Test description");
    await user.click(screen.getByRole("button", { name: /Create Collection$/ }));

    expect(mockOnCreate).toHaveBeenCalledWith("Test Collection", "Test description");
  });

  it("calls onCreate with name only (no description)", async () => {
    mockOnCreate.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    await user.type(screen.getByPlaceholderText(/e.g., My API Collection/), "Test Collection");
    await user.click(screen.getByRole("button", { name: /Create Collection$/ }));

    expect(mockOnCreate).toHaveBeenCalledWith("Test Collection", undefined);
  });

  it("trims whitespace from name and description", async () => {
    mockOnCreate.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    await user.type(screen.getByPlaceholderText(/e.g., My API Collection/), "  Test Collection  ");
    await user.type(screen.getByPlaceholderText(/Describe this collection/), "  Test description  ");
    await user.click(screen.getByRole("button", { name: /Create Collection$/ }));

    expect(mockOnCreate).toHaveBeenCalledWith("Test Collection", "Test description");
  });

  it("shows loading state while creating", async () => {
    let resolveCreate: () => void;
    mockOnCreate.mockImplementation(() => new Promise<void>((resolve) => {
      resolveCreate = resolve;
    }));

    const user = userEvent.setup();
    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    await user.type(screen.getByPlaceholderText(/e.g., My API Collection/), "Test");
    await user.click(screen.getByRole("button", { name: /Create Collection$/ }));

    expect(screen.getByText("Creating...")).toBeInTheDocument();

    resolveCreate!();
    await waitFor(() => expect(mockOnClose).toHaveBeenCalled());
  });

  it("shows error when onCreate fails", async () => {
    mockOnCreate.mockRejectedValue(new Error("Network error"));

    const user = userEvent.setup();
    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    await user.type(screen.getByPlaceholderText(/e.g., My API Collection/), "Test");
    await user.click(screen.getByRole("button", { name: /Create Collection$/ }));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("handles string errors", async () => {
    mockOnCreate.mockRejectedValue("String error message");

    const user = userEvent.setup();
    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    await user.type(screen.getByPlaceholderText(/e.g., My API Collection/), "Test");
    await user.click(screen.getByRole("button", { name: /Create Collection$/ }));

    await waitFor(() => {
      expect(screen.getByText("String error message")).toBeInTheDocument();
    });
  });

  it("handles unknown error types", async () => {
    mockOnCreate.mockRejectedValue({ unknown: "error" });

    const user = userEvent.setup();
    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    await user.type(screen.getByPlaceholderText(/e.g., My API Collection/), "Test");
    await user.click(screen.getByRole("button", { name: /Create Collection$/ }));

    await waitFor(() => {
      // String({ unknown: "error" }) returns "[object Object]"
      expect(screen.getByText("[object Object]")).toBeInTheDocument();
    });
  });

  it("submits on Enter key press", async () => {
    mockOnCreate.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    const nameInput = screen.getByPlaceholderText(/e.g., My API Collection/);
    await user.type(nameInput, "Test Collection");
    await user.keyboard("{Enter}");

    expect(mockOnCreate).toHaveBeenCalledWith("Test Collection", undefined);
  });

  it("resets form on close", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    await user.type(screen.getByPlaceholderText(/e.g., My API Collection/), "Test");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // Re-render to check if form was reset
    rerender(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.getByPlaceholderText(/e.g., My API Collection/)).toHaveValue("");
  });

  it("clears error when closing", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    // Trigger an error
    await user.click(screen.getByRole("button", { name: /Create Collection$/ }));
    expect(screen.getByText("Please enter a collection name")).toBeInTheDocument();

    // Close and re-open
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    rerender(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.queryByText("Please enter a collection name")).not.toBeInTheDocument();
  });

  it("disables submit button while creating", async () => {
    let resolveCreate: () => void;
    mockOnCreate.mockImplementation(() => new Promise<void>((resolve) => {
      resolveCreate = resolve;
    }));

    const user = userEvent.setup();
    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    await user.type(screen.getByPlaceholderText(/e.g., My API Collection/), "Test");
    await user.click(screen.getByRole("button", { name: /Create Collection$/ }));

    // Button should be disabled while creating
    const submitButton = screen.getByRole("button", { name: /Creating/ });
    expect(submitButton).toBeDisabled();

    resolveCreate!();
  });
});
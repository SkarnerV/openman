import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnvironmentsPage } from "./EnvironmentsPage";
import { useEnvironmentStore } from "../stores/useEnvironmentStore";

describe("EnvironmentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useEnvironmentStore.setState({
      environments: [],
      activeEnvironment: null,
      isLoading: false,
      error: null,
      initialized: true,
      loadEnvironments: vi.fn(),
      createEnvironment: vi.fn(),
      updateEnvironment: vi.fn(),
      deleteEnvironment: vi.fn(),
      setActiveEnvironment: vi.fn(),
      addVariable: vi.fn(),
      updateVariable: vi.fn(),
      deleteVariable: vi.fn(),
    });
  });

  it("creates an environment from the empty-state button", async () => {
    const user = userEvent.setup();

    const createEnvironment = vi.fn().mockImplementation(async (name: string) => {
      const createdEnvironment = {
        id: "env-1",
        name,
        isActive: false,
        variables: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      useEnvironmentStore.setState((state) => ({
        environments: [...state.environments, createdEnvironment],
      }));

      return createdEnvironment;
    });

    useEnvironmentStore.setState({ createEnvironment });

    render(<EnvironmentsPage />);

    // Click the create button to open modal
    await user.click(screen.getByRole("button", { name: /create environment/i }));

    // Modal should be visible
    expect(screen.getByRole("heading", { name: /create environment/i })).toBeInTheDocument();

    // Enter name in the input
    const input = screen.getByPlaceholderText(/development, staging, production/i);
    await user.type(input, "Production");

    // Click create button in modal
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createEnvironment).toHaveBeenCalledWith("Production");

    await waitFor(() => {
      expect(screen.getAllByText("Production")).toHaveLength(2);
    });
    expect(screen.queryByText(/no environments yet/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Production" })).toBeInTheDocument();
  });

  it("does nothing when the modal is cancelled", async () => {
    const user = userEvent.setup();

    const createEnvironment = vi.fn();
    useEnvironmentStore.setState({ createEnvironment });

    render(<EnvironmentsPage />);

    // Click the create button to open modal
    await user.click(screen.getByRole("button", { name: /create environment/i }));

    // Modal should be visible
    expect(screen.getByRole("heading", { name: /create environment/i })).toBeInTheDocument();

    // Click cancel button
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(createEnvironment).not.toHaveBeenCalled();
    expect(screen.getByText(/no environments yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /create environment/i })).not.toBeInTheDocument();
  });

  it("shows an error when environment creation fails", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const createEnvironment = vi.fn().mockRejectedValue(new Error("create failed"));
    useEnvironmentStore.setState({ createEnvironment });

    render(<EnvironmentsPage />);

    // Click the create button to open modal
    await user.click(screen.getByRole("button", { name: /create environment/i }));

    // Enter name in the input
    const input = screen.getByPlaceholderText(/development, staging, production/i);
    await user.type(input, "Production");

    // Click create button in modal
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createEnvironment).toHaveBeenCalledWith("Production");
    });

    // Error should be shown in modal
    await waitFor(() => {
      expect(screen.getByText("create failed")).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("shows validation error when name is empty", async () => {
    const user = userEvent.setup();

    const createEnvironment = vi.fn();
    useEnvironmentStore.setState({ createEnvironment });

    render(<EnvironmentsPage />);

    // Click the create button to open modal
    await user.click(screen.getByRole("button", { name: /create environment/i }));

    // Click create button without entering a name
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(createEnvironment).not.toHaveBeenCalled();
    expect(screen.getByText(/please enter an environment name/i)).toBeInTheDocument();
  });
});
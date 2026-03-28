import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createEnvironment,
  getEnvironments,
  setActiveEnvironment,
} from "./storageService";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

describe("storageService environment commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses camelCase arguments when creating an environment", async () => {
    invokeMock.mockResolvedValue({
      id: "env-1",
      name: "Production",
      isActive: false,
      variables: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    await createEnvironment("workspace-1", "Production");

    expect(invokeMock).toHaveBeenCalledWith("create_environment", {
      workspaceId: "workspace-1",
      name: "Production",
    });
  });

  it("uses camelCase arguments when loading environments", async () => {
    invokeMock.mockResolvedValue([]);

    await getEnvironments("workspace-1");

    expect(invokeMock).toHaveBeenCalledWith("get_environments", {
      workspaceId: "workspace-1",
    });
  });

  it("uses camelCase arguments when changing the active environment", async () => {
    invokeMock.mockResolvedValue(undefined);

    await setActiveEnvironment("workspace-1", "env-1");

    expect(invokeMock).toHaveBeenCalledWith("set_active_environment", {
      workspaceId: "workspace-1",
      environmentId: "env-1",
    });
  });
});
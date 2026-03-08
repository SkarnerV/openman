import { invoke } from "@tauri-apps/api/core";
import type { Workspace, Collection, Environment } from "../stores";

// Workspace operations
export async function getWorkspaces(): Promise<Workspace[]> {
  return invoke("get_workspaces");
}

export async function createWorkspace(
  name: string,
  description?: string,
): Promise<Workspace> {
  return invoke("create_workspace", { name, description });
}

// Collection operations
export async function getCollections(
  workspaceId: string,
): Promise<Collection[]> {
  return invoke("get_collections", { workspaceId });
}

export async function createCollection(
  workspaceId: string,
  name: string,
  description?: string,
): Promise<Collection> {
  return invoke("create_collection", { workspaceId, name, description });
}

// Environment operations
export async function getEnvironments(
  workspaceId: string,
): Promise<Environment[]> {
  return invoke("get_environments", { workspaceId });
}

export async function createEnvironment(
  workspaceId: string,
  name: string,
): Promise<Environment> {
  return invoke("create_environment", { workspaceId, name });
}

// Import/Export
export async function importPostmanCollection(
  workspaceId: string,
  json: string,
): Promise<Collection> {
  return invoke("import_postman_collection", { workspaceId, json });
}

export async function exportPostmanCollection(
  collectionId: string,
): Promise<string> {
  return invoke("export_postman_collection", { collectionId });
}

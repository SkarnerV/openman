import { invoke } from "@tauri-apps/api/core";

// Types
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  theme: string;
  fontSize: number;
  tabSize: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  auth?: AuthConfig;
  variables: Variable[];
  items: CollectionItem[];
  createdAt: string;
  updatedAt: string;
}

export type CollectionItem = HttpRequest | Collection;

export interface Variable {
  key: string;
  value: string;
  type: string;
  description?: string;
  enabled: boolean;
}

export type AuthConfig =
  | { type: "none" }
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | { type: "api-key"; key: string; value: string; addTo: "header" | "query" };

export interface HttpRequest {
  id: string;
  name: string;
  description?: string;
  method: string;
  url: string;
  headers: Header[];
  body?: RequestBody;
  auth?: AuthConfig;
  createdAt: string;
  updatedAt: string;
}

export interface Header {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export interface RequestBody {
  mode: "none" | "json" | "raw" | "form-data" | "x-www-form-urlencoded" | "binary";
  content?: string;
  language?: string;
}

export interface Environment {
  id: string;
  name: string;
  isActive: boolean;
  variables: EnvironmentVariable[];
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

// Workspace operations
export async function getWorkspaces(): Promise<Workspace[]> {
  return invoke("get_workspaces");
}

export async function getDefaultWorkspace(): Promise<Workspace> {
  return invoke("get_default_workspace");
}

export async function createWorkspace(
  name: string,
  description?: string
): Promise<Workspace> {
  return invoke("create_workspace", { name, description });
}

// Collection operations
export async function getCollections(workspaceId: string): Promise<Collection[]> {
  return invoke("get_collections", { workspaceId });
}

export async function getCollection(
  workspaceId: string,
  collectionId: string
): Promise<Collection> {
  return invoke("get_collection", { workspaceId, collectionId });
}

export async function createCollection(
  workspaceId: string,
  name: string,
  description?: string
): Promise<Collection> {
  return invoke("create_collection", { workspaceId, name, description });
}

export async function updateCollection(
  workspaceId: string,
  collection: Collection
): Promise<void> {
  return invoke("update_collection", { workspaceId, collection });
}

export async function deleteCollection(
  workspaceId: string,
  collectionId: string
): Promise<void> {
  return invoke("delete_collection", { workspaceId, collectionId });
}

// Environment operations
export async function getEnvironments(workspaceId: string): Promise<Environment[]> {
  return invoke("get_environments", { workspaceId });
}

export async function getEnvironment(
  workspaceId: string,
  environmentId: string
): Promise<Environment> {
  return invoke("get_environment", { workspaceId, environmentId });
}

export async function createEnvironment(
  workspaceId: string,
  name: string
): Promise<Environment> {
  return invoke("create_environment", { workspaceId, name });
}

export async function updateEnvironment(
  workspaceId: string,
  environment: Environment
): Promise<void> {
  return invoke("update_environment", { workspaceId, environment });
}

export async function deleteEnvironment(
  workspaceId: string,
  environmentId: string
): Promise<void> {
  return invoke("delete_environment", { workspaceId, environmentId });
}

export async function setActiveEnvironment(
  workspaceId: string,
  environmentId: string | null
): Promise<void> {
  return invoke("set_active_environment", { workspaceId, environmentId });
}

// Import/Export
export async function importPostmanCollection(
  workspaceId: string,
  json: string
): Promise<Collection> {
  return invoke("import_postman_collection", { workspaceId, json });
}

export async function exportPostmanCollection(
  collectionId: string
): Promise<string> {
  return invoke("export_postman_collection", { collectionId });
}
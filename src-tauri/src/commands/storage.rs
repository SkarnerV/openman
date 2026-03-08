use crate::models::collection::{Collection, Workspace};
use crate::models::environment::Environment;
use crate::storage;
use tauri::command;

#[command]
pub fn get_workspaces() -> Result<Vec<Workspace>, String> {
    storage::workspace::get_all_workspaces().map_err(|e| e.to_string())
}

#[command]
pub fn create_workspace(name: String, description: Option<String>) -> Result<Workspace, String> {
    storage::workspace::create_workspace(&name, description.as_deref())
        .map_err(|e| e.to_string())
}

#[command]
pub fn get_collections(workspace_id: String) -> Result<Vec<Collection>, String> {
    storage::collection::get_collections(&workspace_id).map_err(|e| e.to_string())
}

#[command]
pub fn create_collection(
    workspace_id: String,
    name: String,
    description: Option<String>,
) -> Result<Collection, String> {
    storage::collection::create_collection(&workspace_id, &name, description.as_deref())
        .map_err(|e| e.to_string())
}

#[command]
pub fn get_environments(workspace_id: String) -> Result<Vec<Environment>, String> {
    storage::environment::get_environments(&workspace_id).map_err(|e| e.to_string())
}

#[command]
pub fn create_environment(
    workspace_id: String,
    name: String,
) -> Result<Environment, String> {
    storage::environment::create_environment(&workspace_id, &name).map_err(|e| e.to_string())
}

#[command]
pub fn import_postman_collection(
    workspace_id: String,
    json: String,
) -> Result<Collection, String> {
    crate::utils::import_export::import_postman_collection(&workspace_id, &json)
        .map_err(|e| e.to_string())
}

#[command]
pub fn export_postman_collection(collection_id: String) -> Result<String, String> {
    crate::utils::import_export::export_postman_collection(&collection_id)
        .map_err(|e| e.to_string())
}
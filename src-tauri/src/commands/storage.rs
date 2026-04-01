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
pub fn get_default_workspace() -> Result<Workspace, String> {
    storage::workspace::get_or_create_default_workspace().map_err(|e| e.to_string())
}

// Collection commands

#[command]
pub fn get_collections(workspace_id: String) -> Result<Vec<Collection>, String> {
    storage::collection::get_collections(&workspace_id).map_err(|e| e.to_string())
}

#[command]
pub fn get_collection(workspace_id: String, collection_id: String) -> Result<Collection, String> {
    storage::collection::get_collection(&workspace_id, &collection_id).map_err(|e| e.to_string())
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
pub fn update_collection(
    workspace_id: String,
    collection: Collection,
) -> Result<(), String> {
    storage::collection::update_collection(&workspace_id, &collection).map_err(|e| e.to_string())
}

#[command]
pub fn delete_collection(
    workspace_id: String,
    collection_id: String,
) -> Result<(), String> {
    storage::collection::delete_collection(&workspace_id, &collection_id).map_err(|e| e.to_string())
}

// Environment commands

#[command]
pub fn get_environments(workspace_id: String) -> Result<Vec<Environment>, String> {
    storage::environment::get_environments(&workspace_id).map_err(|e| e.to_string())
}

#[command]
pub fn get_environment(workspace_id: String, environment_id: String) -> Result<Environment, String> {
    storage::environment::get_environment(&workspace_id, &environment_id).map_err(|e| e.to_string())
}

#[command]
pub fn create_environment(
    workspace_id: String,
    name: String,
) -> Result<Environment, String> {
    storage::environment::create_environment(&workspace_id, &name).map_err(|e| e.to_string())
}

#[command]
pub fn update_environment(
    workspace_id: String,
    environment: Environment,
) -> Result<(), String> {
    storage::environment::update_environment(&workspace_id, &environment).map_err(|e| e.to_string())
}

#[command]
pub fn delete_environment(
    workspace_id: String,
    environment_id: String,
) -> Result<(), String> {
    storage::environment::delete_environment(&workspace_id, &environment_id).map_err(|e| e.to_string())
}

#[command]
pub fn set_active_environment(
    workspace_id: String,
    environment_id: Option<String>,
) -> Result<(), String> {
    storage::environment::set_active_environment(&workspace_id, environment_id.as_deref())
        .map_err(|e| e.to_string())
}

// Import/Export

#[command]
pub fn import_postman_collection(
    workspace_id: String,
    json: String,
) -> Result<Collection, String> {
    crate::utils::import_export::import_postman_collection(&workspace_id, &json)
        .map_err(|e| e.to_string())
}

#[command]
pub fn export_postman_collection(
    workspace_id: String,
    collection_id: String,
) -> Result<String, String> {
    crate::utils::import_export::export_postman_collection(&workspace_id, &collection_id)
        .map_err(|e| e.to_string())
}

#[command]
pub fn export_environment(
    workspace_id: String,
    environment_id: String,
) -> Result<String, String> {
    let environment = storage::environment::get_environment(&workspace_id, &environment_id)
        .map_err(|e| e.to_string())?;
    serde_json::to_string_pretty(&environment).map_err(|e| e.to_string())
}

#[command]
pub fn import_environment(
    workspace_id: String,
    json: String,
) -> Result<Environment, String> {
    let mut environment: Environment = serde_json::from_str(&json).map_err(|e| e.to_string())?;
    // Generate new ID for the imported environment
    environment.id = uuid::Uuid::new_v4().to_string();
    environment.is_active = false;
    storage::environment::create_environment_with_data(&workspace_id, environment.clone())
        .map_err(|e| e.to_string())?;
    Ok(environment)
}
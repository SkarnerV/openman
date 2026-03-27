mod commands;
mod engines;
mod models;
mod storage;
mod utils;

use std::sync::OnceLock;
use tauri::{AppHandle, Manager};

// Global app handle for storage operations
pub static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Store app handle globally
            let app_handle = app.handle();
            let _ = APP_HANDLE.set(app_handle.clone());

            // Initialize storage
            storage::init(app_handle)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // HTTP commands
            commands::http::send_http_request,
            // Workspace commands
            commands::storage::get_workspaces,
            commands::storage::get_default_workspace,
            commands::storage::create_workspace,
            // Collection commands
            commands::storage::get_collections,
            commands::storage::get_collection,
            commands::storage::create_collection,
            commands::storage::update_collection,
            commands::storage::delete_collection,
            // Environment commands
            commands::storage::get_environments,
            commands::storage::get_environment,
            commands::storage::create_environment,
            commands::storage::update_environment,
            commands::storage::delete_environment,
            commands::storage::set_active_environment,
            // Import/Export
            commands::storage::import_postman_collection,
            commands::storage::export_postman_collection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
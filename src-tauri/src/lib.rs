mod commands;
mod engines;
mod models;
mod storage;
mod utils;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize storage
            let app_handle = app.handle();
            storage::init(app_handle)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // HTTP commands
            commands::http::send_http_request,
            // Storage commands
            commands::storage::get_workspaces,
            commands::storage::create_workspace,
            commands::storage::get_collections,
            commands::storage::create_collection,
            commands::storage::get_environments,
            commands::storage::create_environment,
            // Utils
            commands::storage::import_postman_collection,
            commands::storage::export_postman_collection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
use tauri::{AppHandle, Manager};

use crate::storage::logging::{append_log, get_log_dates, read_logs, LogEntry};

/// Append a user action log entry
#[tauri::command]
pub fn log_user_action(
    app_handle: AppHandle,
    version: String,
    category: String,
    action: String,
    label: Option<String>,
    value: Option<serde_json::Value>,
    metadata: Option<serde_json::Value>,
) -> Result<(), String> {
    let entry = LogEntry {
        timestamp: chrono::Local::now().to_rfc3339(),
        version,
        category,
        action,
        label,
        value,
        metadata,
    };

    append_log(&app_handle, &entry).map_err(|e| e.to_string())?;

    // Also log to console for debugging
    println!(
        "[Openman v{}] User Action: {} | {} | label: {}",
        entry.version,
        entry.category,
        entry.action,
        entry.label.as_deref().unwrap_or("none")
    );

    Ok(())
}

/// Read logs for a specific date
#[tauri::command]
pub fn get_logs(app_handle: AppHandle, date: String) -> Result<Vec<String>, String> {
    read_logs(&app_handle, &date).map_err(|e| e.to_string())
}

/// Get list of available log dates
#[tauri::command]
pub fn get_log_dates_list(app_handle: AppHandle) -> Result<Vec<String>, String> {
    get_log_dates(&app_handle).map_err(|e| e.to_string())
}
use anyhow::Result;
use chrono::Local;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use super::get_data_dir;

/// Get the logs directory path
pub fn get_logs_dir(app_handle: &AppHandle) -> Result<PathBuf> {
    Ok(get_data_dir(app_handle)?.join("logs"))
}

/// Initialize the logs directory
pub fn init(app_handle: &AppHandle) -> Result<()> {
    let logs_dir = get_logs_dir(app_handle)?;
    std::fs::create_dir_all(&logs_dir)?;
    Ok(())
}

/// Log entry structure
#[derive(serde::Serialize, serde::Deserialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub version: String,
    pub category: String,
    pub action: String,
    pub label: Option<String>,
    pub value: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
}

/// Append a log entry to the daily log file
pub fn append_log(app_handle: &AppHandle, entry: &LogEntry) -> Result<()> {
    let logs_dir = get_logs_dir(app_handle)?;

    // Use daily log file: openman-YYYY-MM-DD.log
    let today = Local::now().format("%Y-%m-%d");
    let log_file = logs_dir.join(format!("openman-{}.log", today));

    // Format log line
    let log_line = format!(
        "[{}] v{} | {} | {} | label: {} | value: {} | metadata: {}\n",
        entry.timestamp,
        entry.version,
        entry.category,
        entry.action,
        entry.label.as_deref().unwrap_or("none"),
        entry.value.as_ref().map(|v| v.to_string()).unwrap_or_else(|| "none".to_string()),
        entry.metadata.as_ref().map(|m| m.to_string()).unwrap_or_else(|| "none".to_string())
    );

    // Append to file (create if not exists)
    use std::fs::OpenOptions;
    use std::io::Write;

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file)?;

    file.write_all(log_line.as_bytes())?;

    Ok(())
}

/// Read logs from a specific date
pub fn read_logs(app_handle: &AppHandle, date: &str) -> Result<Vec<String>> {
    let logs_dir = get_logs_dir(app_handle)?;
    let log_file = logs_dir.join(format!("openman-{}.log", date));

    if !log_file.exists() {
        return Ok(Vec::new());
    }

    let content = std::fs::read_to_string(&log_file)?;
    Ok(content.lines().map(|s| s.to_string()).collect())
}

/// Get available log dates
pub fn get_log_dates(app_handle: &AppHandle) -> Result<Vec<String>> {
    let logs_dir = get_logs_dir(app_handle)?;

    if !logs_dir.exists() {
        return Ok(Vec::new());
    }

    let mut dates: Vec<String> = Vec::new();
    for entry in std::fs::read_dir(&logs_dir)? {
        let entry = entry?;
        let file_name = entry.file_name().to_string_lossy().to_string();
        if file_name.starts_with("openman-") && file_name.ends_with(".log") {
            // Extract date from filename: openman-YYYY-MM-DD.log
            if let Some(date) = file_name.strip_prefix("openman-").and_then(|s| s.strip_suffix(".log")) {
                dates.push(date.to_string());
            }
        }
    }

    dates.sort();
    dates.reverse(); // Most recent first
    Ok(dates)
}
pub mod workspace;
pub mod collection;
pub mod environment;

use anyhow::Result;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub fn init(app_handle: &AppHandle) -> Result<()> {
    let data_dir = get_data_dir(app_handle)?;
    std::fs::create_dir_all(&data_dir)?;
    std::fs::create_dir_all(data_dir.join("workspaces"))?;
    Ok(())
}

pub fn get_data_dir(app_handle: &AppHandle) -> Result<PathBuf> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| anyhow::anyhow!("Failed to get app data dir: {}", e))?;
    Ok(app_data_dir)
}

pub fn get_workspaces_dir(app_handle: &AppHandle) -> Result<PathBuf> {
    Ok(get_data_dir(app_handle)?.join("workspaces"))
}

pub fn get_workspace_dir(app_handle: &AppHandle, workspace_id: &str) -> Result<PathBuf> {
    Ok(get_workspaces_dir(app_handle)?.join(workspace_id))
}

pub fn read_json_file<T: serde::de::DeserializeOwned>(path: &PathBuf) -> Result<T> {
    let content = std::fs::read_to_string(path)?;
    let data: T = serde_json::from_str(&content)?;
    Ok(data)
}

pub fn write_json_file<T: serde::Serialize>(path: &PathBuf, data: &T) -> Result<()> {
    let content = serde_json::to_string_pretty(data)?;
    std::fs::write(path, content)?;
    Ok(())
}
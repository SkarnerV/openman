use crate::models::collection::{Workspace, WorkspaceSettings};
use crate::storage::{read_json_file, write_json_file, get_data_dir};
use anyhow::Result;
use chrono::Utc;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use uuid::Uuid;

const DEFAULT_WORKSPACE_NAME: &str = "My Workspace";

pub fn get_all_workspaces() -> Result<Vec<Workspace>> {
    let workspaces_dir = get_workspaces_dir()?;
    if !workspaces_dir.exists() {
        return Ok(Vec::new());
    }

    let mut workspaces = Vec::new();
    for entry in fs::read_dir(workspaces_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            let workspace_file = path.join("workspace.json");
            if workspace_file.exists() {
                if let Ok(workspace) = read_json_file::<Workspace>(&workspace_file) {
                    workspaces.push(workspace);
                }
            }
        }
    }

    Ok(workspaces)
}

pub fn get_or_create_default_workspace() -> Result<Workspace> {
    let workspaces = get_all_workspaces()?;

    // Return first workspace if exists
    if let Some(workspace) = workspaces.first() {
        return Ok(workspace.clone());
    }

    // Create default workspace
    create_workspace(DEFAULT_WORKSPACE_NAME, None)
}

pub fn get_workspace(workspace_id: &str) -> Result<Workspace> {
    let workspace_file = get_workspaces_dir()?
        .join(workspace_id)
        .join("workspace.json");
    read_json_file(&workspace_file)
}

pub fn create_workspace(name: &str, description: Option<&str>) -> Result<Workspace> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let workspace = Workspace {
        id: id.clone(),
        name: name.to_string(),
        description: description.map(|s| s.to_string()),
        created_at: now.clone(),
        updated_at: now,
        settings: WorkspaceSettings::default(),
    };

    let workspace_dir = get_workspaces_dir()?.join(&id);
    fs::create_dir_all(&workspace_dir)?;
    fs::create_dir_all(workspace_dir.join("collections"))?;
    fs::create_dir_all(workspace_dir.join("environments"))?;
    fs::create_dir_all(workspace_dir.join("history"))?;

    let workspace_file = workspace_dir.join("workspace.json");
    write_json_file(&workspace_file, &workspace)?;

    Ok(workspace)
}

pub fn update_workspace(workspace: &Workspace) -> Result<()> {
    let workspace_file = get_workspaces_dir()?
        .join(&workspace.id)
        .join("workspace.json");
    write_json_file(&workspace_file, workspace)
}

pub fn delete_workspace(workspace_id: &str) -> Result<()> {
    let workspace_dir = get_workspaces_dir()?.join(workspace_id);
    if workspace_dir.exists() {
        fs::remove_dir_all(workspace_dir)?;
    }
    Ok(())
}

fn get_workspaces_dir() -> Result<PathBuf> {
    // Use Tauri's app data directory
    let app_handle = crate::APP_HANDLE.get().ok_or_else(|| {
        anyhow::anyhow!("App handle not initialized")
    })?;
    get_data_dir(app_handle).map(|p| p.join("workspaces"))
}
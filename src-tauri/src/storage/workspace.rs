use crate::models::collection::{Workspace, WorkspaceSettings};
use crate::storage::{get_data_dir, read_json_file, write_json_file};
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
                if let Ok(mut workspace) = read_json_file::<Workspace>(&workspace_file) {
                    normalize_workspace_settings(&mut workspace.settings);
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
    let mut workspace = read_json_file::<Workspace>(&workspace_file)?;
    normalize_workspace_settings(&mut workspace.settings);
    Ok(workspace)
}

pub fn create_workspace(name: &str, description: Option<&str>) -> Result<Workspace> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let mut workspace = Workspace {
        id: id.clone(),
        name: name.to_string(),
        description: description.map(|s| s.to_string()),
        created_at: now.clone(),
        updated_at: now,
        settings: WorkspaceSettings::default(),
    };
    normalize_workspace_settings(&mut workspace.settings);

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
    let mut workspace = workspace.clone();
    normalize_workspace_settings(&mut workspace.settings);
    let workspace_file = get_workspaces_dir()?
        .join(&workspace.id)
        .join("workspace.json");
    write_json_file(&workspace_file, &workspace)
}

pub fn update_workspace_settings(workspace_id: &str, settings: WorkspaceSettings) -> Result<()> {
    let mut workspace = get_workspace(workspace_id)?;
    let mut settings = settings;
    normalize_workspace_settings(&mut settings);
    workspace.settings = settings;
    workspace.updated_at = Utc::now().to_rfc3339();
    update_workspace(&workspace)
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
    let app_handle = crate::APP_HANDLE
        .get()
        .ok_or_else(|| anyhow::anyhow!("App handle not initialized"))?;
    get_data_dir(app_handle).map(|p| p.join("workspaces"))
}

fn normalize_workspace_settings(settings: &mut WorkspaceSettings) {
    if let Some(proxy) = settings.proxy.as_mut() {
        if proxy
            .no_proxy
            .as_ref()
            .is_some_and(|value| value.trim().is_empty())
        {
            proxy.no_proxy = None;
        }
    }
}

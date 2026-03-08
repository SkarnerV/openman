use crate::models::collection::{Workspace, WorkspaceSettings};
use crate::storage::{get_workspaces_dir, get_workspace_dir, read_json_file, write_json_file};
use anyhow::Result;
use chrono::Utc;
use std::fs;
use uuid::Uuid;

pub fn get_all_workspaces() -> Result<Vec<Workspace>> {
    let dirs = get_workspaces_dir(&get_app_handle()?)?;
    if !dirs.exists() {
        return Ok(Vec::new());
    }

    let mut workspaces = Vec::new();
    for entry in fs::read_dir(dirs)? {
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

    let workspace_dir = get_workspace_dir(&get_app_handle()?, &id)?;
    fs::create_dir_all(&workspace_dir)?;
    fs::create_dir_all(workspace_dir.join("collections"))?;
    fs::create_dir_all(workspace_dir.join("environments"))?;
    fs::create_dir_all(workspace_dir.join("history"))?;

    let workspace_file = workspace_dir.join("workspace.json");
    write_json_file(&workspace_file, &workspace)?;

    Ok(workspace)
}

// Helper to get app handle - we'll need to pass this properly in production
fn get_app_handle() -> Result<tauri::AppHandle> {
    // This is a placeholder - in production we'd pass the handle through
    Err(anyhow::anyhow!("App handle not available"))
}
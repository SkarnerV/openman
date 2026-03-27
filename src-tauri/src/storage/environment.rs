use crate::models::environment::Environment;
use crate::storage::{read_json_file, write_json_file, get_data_dir};
use anyhow::Result;
use chrono::Utc;
use std::fs;
use tauri::Manager;
use uuid::Uuid;

pub fn get_environments(workspace_id: &str) -> Result<Vec<Environment>> {
    let envs_dir = get_environments_dir(workspace_id)?;
    if !envs_dir.exists() {
        return Ok(Vec::new());
    }

    let mut environments = Vec::new();
    for entry in fs::read_dir(envs_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().map(|e| e == "json").unwrap_or(false) {
            if let Ok(env) = read_json_file::<Environment>(&path) {
                environments.push(env);
            }
        }
    }

    Ok(environments)
}

pub fn create_environment(workspace_id: &str, name: &str) -> Result<Environment> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let environment = Environment {
        id: id.clone(),
        name: name.to_string(),
        is_active: false,
        variables: vec![],
        created_at: now.clone(),
        updated_at: now,
    };

    let envs_dir = get_environments_dir(workspace_id)?;
    fs::create_dir_all(&envs_dir)?;

    let env_file = envs_dir.join(format!("{}.json", id));
    write_json_file(&env_file, &environment)?;

    Ok(environment)
}

pub fn get_environment(workspace_id: &str, env_id: &str) -> Result<Environment> {
    let env_file = get_environments_dir(workspace_id)?.join(format!("{}.json", env_id));
    read_json_file(&env_file)
}

pub fn update_environment(workspace_id: &str, env: &Environment) -> Result<()> {
    let env_file = get_environments_dir(workspace_id)?.join(format!("{}.json", env.id));
    write_json_file(&env_file, env)
}

pub fn delete_environment(workspace_id: &str, env_id: &str) -> Result<()> {
    let env_file = get_environments_dir(workspace_id)?.join(format!("{}.json", env_id));
    fs::remove_file(env_file)?;
    Ok(())
}

pub fn set_active_environment(workspace_id: &str, active_env_id: Option<&str>) -> Result<()> {
    let envs_dir = get_environments_dir(workspace_id)?;
    if !envs_dir.exists() {
        return Ok(());
    }

    // First, deactivate all environments
    for entry in fs::read_dir(&envs_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().map(|e| e == "json").unwrap_or(false) {
            if let Ok(mut env) = read_json_file::<Environment>(&path) {
                env.is_active = false;
                write_json_file(&path, &env)?;
            }
        }
    }

    // Then activate the specified environment
    if let Some(env_id) = active_env_id {
        let env_file = envs_dir.join(format!("{}.json", env_id));
        if env_file.exists() {
            if let Ok(mut env) = read_json_file::<Environment>(&env_file) {
                env.is_active = true;
                write_json_file(&env_file, &env)?;
            }
        }
    }

    Ok(())
}

fn get_environments_dir(workspace_id: &str) -> Result<std::path::PathBuf> {
    let app_handle = crate::APP_HANDLE.get().ok_or_else(|| {
        anyhow::anyhow!("App handle not initialized")
    })?;
    let data_dir = get_data_dir(app_handle)?;
    Ok(data_dir.join("workspaces").join(workspace_id).join("environments"))
}
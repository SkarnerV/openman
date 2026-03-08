use crate::models::environment::{Environment, EnvironmentVariable};
use crate::storage::{read_json_file, write_json_file};
use anyhow::Result;
use chrono::Utc;
use std::fs;
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

fn get_environments_dir(workspace_id: &str) -> Result<std::path::PathBuf> {
    let workspace_dir = std::path::PathBuf::from(".openman").join("workspaces").join(workspace_id);
    Ok(workspace_dir.join("environments"))
}
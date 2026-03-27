use crate::models::collection::Collection;
use crate::storage::{read_json_file, write_json_file, get_data_dir};
use anyhow::Result;
use chrono::Utc;
use std::fs;
use tauri::Manager;
use uuid::Uuid;

pub fn get_collections(workspace_id: &str) -> Result<Vec<Collection>> {
    let collections_dir = get_collections_dir(workspace_id)?;
    if !collections_dir.exists() {
        return Ok(Vec::new());
    }

    let mut collections = Vec::new();
    for entry in fs::read_dir(collections_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().map(|e| e == "json").unwrap_or(false) {
            if let Ok(collection) = read_json_file::<Collection>(&path) {
                collections.push(collection);
            }
        }
    }

    Ok(collections)
}

pub fn create_collection(
    workspace_id: &str,
    name: &str,
    description: Option<&str>,
) -> Result<Collection> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let collection = Collection {
        id: id.clone(),
        name: name.to_string(),
        description: description.map(|s| s.to_string()),
        parent_id: None,
        auth: None,
        variables: vec![],
        items: vec![],
        created_at: now.clone(),
        updated_at: now,
    };

    let collections_dir = get_collections_dir(workspace_id)?;
    fs::create_dir_all(&collections_dir)?;

    let collection_file = collections_dir.join(format!("{}.json", id));
    write_json_file(&collection_file, &collection)?;

    Ok(collection)
}

pub fn get_collection(workspace_id: &str, collection_id: &str) -> Result<Collection> {
    let collection_file = get_collections_dir(workspace_id)?.join(format!("{}.json", collection_id));
    read_json_file(&collection_file)
}

pub fn update_collection(workspace_id: &str, collection: &Collection) -> Result<()> {
    let collection_file = get_collections_dir(workspace_id)?.join(format!("{}.json", collection.id));
    write_json_file(&collection_file, collection)
}

pub fn delete_collection(workspace_id: &str, collection_id: &str) -> Result<()> {
    let collection_file = get_collections_dir(workspace_id)?.join(format!("{}.json", collection_id));
    fs::remove_file(collection_file)?;
    Ok(())
}

fn get_collections_dir(workspace_id: &str) -> Result<std::path::PathBuf> {
    let app_handle = crate::APP_HANDLE.get().ok_or_else(|| {
        anyhow::anyhow!("App handle not initialized")
    })?;
    let data_dir = get_data_dir(app_handle)?;
    Ok(data_dir.join("workspaces").join(workspace_id).join("collections"))
}
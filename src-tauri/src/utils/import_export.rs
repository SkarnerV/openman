use crate::models::collection::{Collection, CollectionItem, Variable};
use crate::models::request::{AuthConfig, Header, HttpRequest, HttpMethod, RequestBody};
use crate::storage::collection::{create_collection, get_collection, update_collection};
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PostmanCollection {
    pub info: PostmanInfo,
    pub item: Vec<PostmanItem>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variable: Option<Vec<PostmanVariable>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PostmanInfo {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub schema: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostmanItem {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub item: Option<Vec<PostmanItem>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request: Option<PostmanRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PostmanRequest {
    pub method: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<PostmanUrl>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub header: Option<Vec<PostmanHeader>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<PostmanBody>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth: Option<PostmanAuth>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostmanUrl {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostmanHeader {
    pub key: String,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostmanBody {
    pub mode: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostmanAuth {
    #[serde(rename = "type")]
    pub auth_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bearer: Option<Vec<serde_json::Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub basic: Option<Vec<serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostmanVariable {
    pub key: String,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub var_type: Option<String>,
}

pub fn import_postman_collection(workspace_id: &str, json: &str) -> Result<Collection> {
    let postman: PostmanCollection = serde_json::from_str(json)
        .context("Failed to parse Postman collection JSON")?;

    let collection = convert_postman_to_collection(&postman)?;
    create_collection(workspace_id, &collection.name, collection.description.as_deref())?;

    // Now update with all items
    let saved = get_collection(workspace_id, &collection.id)?;
    let mut saved = saved;
    saved.items = collection.items;
    update_collection(workspace_id, &saved)?;

    Ok(saved)
}

pub fn export_postman_collection(collection_id: &str) -> Result<String> {
    // Placeholder - would need to fetch collection and convert
    Err(anyhow::anyhow!("Not implemented yet"))
}

fn convert_postman_to_collection(postman: &PostmanCollection) -> Result<Collection> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let variables = postman
        .variable
        .as_ref()
        .map(|vars| vars.iter().map(convert_variable).collect())
        .unwrap_or_default();

    let items = postman
        .item
        .iter()
        .map(|item| convert_postman_item(item))
        .collect();

    Ok(Collection {
        id,
        name: postman.info.name.clone(),
        description: postman.info.description.clone(),
        parent_id: None,
        auth: None,
        variables,
        items,
        created_at: now.clone(),
        updated_at: now,
    })
}

fn convert_postman_item(item: &PostmanItem) -> CollectionItem {
    if let Some(sub_items) = &item.item {
        // It's a folder
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        CollectionItem::Collection(Box::new(Collection {
            id,
            name: item.name.clone(),
            description: None,
            parent_id: None,
            auth: None,
            variables: vec![],
            items: sub_items.iter().map(convert_postman_item).collect(),
            created_at: now.clone(),
            updated_at: now,
        }))
    } else if let Some(request) = &item.request {
        CollectionItem::Request(Box::new(convert_postman_request(&item.name, request)))
    } else {
        // Empty item, create a placeholder
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        CollectionItem::Request(Box::new(HttpRequest {
            id,
            name: item.name.clone(),
            description: None,
            method: HttpMethod::GET,
            url: String::new(),
            headers: vec![],
            body: None,
            auth: None,
            pre_request_script: None,
            test_script: None,
            created_at: now.clone(),
            updated_at: now,
        }))
    }
}

fn convert_postman_request(name: &str, request: &PostmanRequest) -> HttpRequest {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let method = match request.method.to_uppercase().as_str() {
        "GET" => HttpMethod::GET,
        "POST" => HttpMethod::POST,
        "PUT" => HttpMethod::PUT,
        "PATCH" => HttpMethod::PATCH,
        "DELETE" => HttpMethod::DELETE,
        "HEAD" => HttpMethod::HEAD,
        "OPTIONS" => HttpMethod::OPTIONS,
        _ => HttpMethod::GET,
    };

    let url = request
        .url
        .as_ref()
        .and_then(|u| u.raw.clone())
        .unwrap_or_default();

    let headers: Vec<Header> = request
        .header
        .as_ref()
        .map(|h| h.iter().map(convert_header).collect())
        .unwrap_or_default();

    let body = request.body.as_ref().and_then(|b| {
        match b.mode.as_str() {
            "raw" => b.raw.as_ref().map(|content| {
                // Try to detect if it's JSON
                RequestBody::Json(content.clone())
            }),
            _ => None,
        }
    });

    let auth = request.auth.as_ref().map(|a| match a.auth_type.as_str() {
        "bearer" => AuthConfig::Bearer {
            token: extract_auth_value(&a.bearer, "token").unwrap_or_default(),
        },
        "basic" => AuthConfig::Basic {
            username: extract_auth_value(&a.basic, "username").unwrap_or_default(),
            password: extract_auth_value(&a.basic, "password").unwrap_or_default(),
        },
        _ => AuthConfig::None,
    });

    HttpRequest {
        id,
        name: name.to_string(),
        description: None,
        method,
        url,
        headers,
        body,
        auth,
        pre_request_script: None,
        test_script: None,
        created_at: now.clone(),
        updated_at: now,
    }
}

fn convert_header(h: &PostmanHeader) -> Header {
    Header {
        key: h.key.clone(),
        value: h.value.clone(),
        description: h.description.clone(),
        enabled: !h.disabled.unwrap_or(false),
    }
}

fn convert_variable(v: &PostmanVariable) -> Variable {
    Variable {
        key: v.key.clone(),
        value: v.value.clone(),
        var_type: v.var_type.clone().unwrap_or_else(|| "string".to_string()),
        description: v.description.clone(),
        enabled: true,
    }
}

fn extract_auth_value(
    auth_list: &Option<Vec<serde_json::Value>>,
    key: &str,
) -> Option<String> {
    auth_list.as_ref().and_then(|list| {
        list.iter().find_map(|item| {
            if let Some(obj) = item.as_object() {
                if obj.get("key")?.as_str()? == key {
                    return obj.get("value")?.as_str().map(|s| s.to_string());
                }
            }
            None
        })
    })
}
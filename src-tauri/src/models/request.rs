use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpRequest {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub method: HttpMethod,
    pub url: String,
    pub headers: Vec<Header>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<RequestBody>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth: Option<AuthConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pre_request_script: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub test_script: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum HttpMethod {
    GET,
    POST,
    PUT,
    PATCH,
    DELETE,
    HEAD,
    OPTIONS,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Header {
    pub key: String,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "mode", rename_all = "camelCase")]
pub enum RequestBody {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "json")]
    Json(String),
    #[serde(rename = "raw")]
    Raw { content: String, language: String },
    #[serde(rename = "form-data")]
    FormData(Vec<FormField>),
    #[serde(rename = "x-www-form-urlencoded")]
    UrlEncoded(Vec<FormField>),
    #[serde(rename = "binary")]
    Binary(String), // Base64 encoded
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormField {
    pub key: String,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r#type: Option<String>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum AuthConfig {
    None,
    Bearer { token: String },
    Basic { username: String, password: String },
    ApiKey { key: String, value: String, add_to: String },
    OAuth2 {
        grant_type: String,
        access_token_url: Option<String>,
        client_id: Option<String>,
        client_secret: Option<String>,
        scope: Option<String>,
        token: Option<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpResponse {
    pub status: i32,
    pub status_text: String,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub response_time: i64,
    pub response_size: i64,
}
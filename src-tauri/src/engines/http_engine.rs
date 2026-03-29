use crate::models::request::{HttpRequest, HttpResponse, HttpMethod, RequestBody};
use anyhow::{Context, Result};
use reqwest::Client;
use std::time::Instant;

pub async fn send_request(request: HttpRequest) -> Result<HttpResponse> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .context("Failed to create HTTP client")?;

    let method = match request.method {
        HttpMethod::GET => reqwest::Method::GET,
        HttpMethod::POST => reqwest::Method::POST,
        HttpMethod::PUT => reqwest::Method::PUT,
        HttpMethod::PATCH => reqwest::Method::PATCH,
        HttpMethod::DELETE => reqwest::Method::DELETE,
        HttpMethod::HEAD => reqwest::Method::HEAD,
        HttpMethod::OPTIONS => reqwest::Method::OPTIONS,
    };

    let mut request_builder = client.request(method, &request.url);

    // Add headers
    for header in &request.headers {
        if header.enabled {
            request_builder = request_builder.header(&header.key, &header.value);
        }
    }

    // Add body
    if let Some(body) = &request.body {
        match body {
            RequestBody::Json(content) => {
                request_builder = request_builder.header("Content-Type", "application/json").body(content.clone());
            }
            RequestBody::Raw { content, language } => {
                let content_type = match language.as_str() {
                    "xml" => "application/xml",
                    "html" => "text/html",
                    "text" => "text/plain",
                    _ => "text/plain",
                };
                request_builder = request_builder.header("Content-Type", content_type).body(content.clone());
            }
            RequestBody::None => {}
            RequestBody::FormData(_) => {
                // TODO: Implement form data
            }
            RequestBody::Binary(_) => {
                // TODO: Implement binary
            }
            RequestBody::UrlEncoded(_) => {
                // TODO: Implement url encoded
            }
        }
    }

    // Add auth
    if let Some(auth) = &request.auth {
        match auth {
            crate::models::request::AuthConfig::Bearer { token } => {
                request_builder = request_builder.bearer_auth(token);
            }
            crate::models::request::AuthConfig::Basic { username, password } => {
                request_builder = request_builder.basic_auth(username, Some(password));
            }
            crate::models::request::AuthConfig::ApiKey { key, value, add_to } => {
                // Add API key as header (query param handling is done in frontend)
                if add_to == "header" {
                    request_builder = request_builder.header(key, value);
                }
                // Note: For query param, the frontend should include it in the URL
            }
            _ => {}
        }
    }

    let start = Instant::now();
    let response = request_builder.send().await.context("Failed to send request")?;
    let duration = start.elapsed();

    let status = response.status();
    let headers: std::collections::HashMap<String, String> = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect();

    let body_bytes = response.bytes().await.context("Failed to read response body")?;
    let body = String::from_utf8_lossy(&body_bytes).to_string();

    Ok(HttpResponse {
        status: status.as_u16() as i32,
        status_text: status.canonical_reason().unwrap_or("").to_string(),
        headers,
        body,
        response_time: duration.as_millis() as i64,
        response_size: body_bytes.len() as i64,
    })
}
use crate::models::collection::ProxySettings;
use crate::models::request::{HttpRequest, HttpResponse, HttpMethod, RequestBody};
use anyhow::{Context, Result, ensure, anyhow};
use reqwest::{Client, NoProxy, Proxy};
use std::time::Instant;
use std::error::Error;

/// Format reqwest errors with detailed, user-friendly messages
fn format_request_error(err: &reqwest::Error, url: &str) -> String {
    let mut details = Vec::new();
    
    if err.is_timeout() {
        details.push("Request timed out".to_string());
        details.push(format!("The request to '{}' took longer than 30 seconds to complete.", url));
        details.push("Suggestions:".to_string());
        details.push("  • Check if the server is responding".to_string());
        details.push("  • Try with a longer timeout if the server is slow".to_string());
    } else if err.is_connect() {
        details.push("Connection failed".to_string());
        if let Some(source) = err.source() {
            let source_str = source.to_string().to_lowercase();
            if source_str.contains("dns") || source_str.contains("resolve") {
                details.push(format!("DNS resolution failed for '{}'.", url));
                details.push("Suggestions:".to_string());
                details.push("  • Check if the URL is correct".to_string());
                details.push("  • Check your internet connection".to_string());
                details.push("  • Try a different DNS server (e.g., 8.8.8.8)".to_string());
            } else if source_str.contains("connection refused") {
                details.push("Connection was refused by the server.".to_string());
                details.push("Suggestions:".to_string());
                details.push("  • Check if the server is running".to_string());
                details.push("  • Verify the port number is correct".to_string());
                details.push("  • Check firewall settings".to_string());
            } else {
                details.push(format!("Network error: {}", source));
            }
        } else {
            details.push(format!("Could not connect to '{}'.", url));
            details.push("Check your network connection and the URL.".to_string());
        }
    } else if err.is_request() {
        details.push("Request construction failed".to_string());
        if let Some(source) = err.source() {
            details.push(format!("Error: {}", source));
        }
    } else if err.is_body() {
        details.push("Failed to send request body".to_string());
        if let Some(source) = err.source() {
            details.push(format!("Error: {}", source));
        }
    } else if err.is_decode() {
        details.push("Failed to decode response".to_string());
        details.push("The server returned data that could not be parsed.".to_string());
        if let Some(source) = err.source() {
            details.push(format!("Error: {}", source));
        }
    } else if err.is_redirect() {
        details.push("Too many redirects".to_string());
        details.push(format!("The server redirected too many times for '{}'.", url));
    } else if err.is_status() {
        if let Some(status) = err.status() {
            details.push(format!("HTTP error: {}", status));
        }
    } else {
        details.push("Request failed".to_string());
        details.push(format!("URL: {}", url));
        let err_msg = err.to_string();
        if !err_msg.is_empty() {
            details.push(format!("Error: {}", err_msg));
        }
        if let Some(source) = err.source() {
            details.push(format!("Details: {}", source));
        }
    }
    
    if let Some(source) = err.source() {
        let source_str = source.to_string().to_lowercase();
        if source_str.contains("certificate") || source_str.contains("ssl") || source_str.contains("tls") {
            details.push("\nSSL/TLS Certificate Error:".to_string());
            details.push("  • The server's certificate could not be verified".to_string());
            details.push("  • If testing a local server, it may use a self-signed certificate".to_string());
        }
    }
    
    details.join("\n")
}

pub async fn send_request(request: HttpRequest, proxy_settings: Option<ProxySettings>) -> Result<HttpResponse> {
    let mut builder = Client::builder()
        .timeout(std::time::Duration::from_secs(30));

    if let Some(proxy_settings) = proxy_settings {
        if proxy_settings.enabled {
            let host = proxy_settings.host.trim();
            ensure!(!host.is_empty(), "Proxy host cannot be empty when proxy is enabled");
            ensure!(proxy_settings.port > 0, "Proxy port must be a positive number (got {})", proxy_settings.port);

            let proxy_url = format!("http://{}:{}", host, proxy_settings.port);
            let mut proxy = Proxy::all(&proxy_url)
                .with_context(|| format!(
                    "Failed to configure proxy '{}:{}'\n\
                    Possible causes:\n\
                    • Invalid host or port format\n\
                    • Proxy URL contains invalid characters\n\
                    • Host name could not be resolved",
                    host, proxy_settings.port
                ))?;

            if let (Some(user), Some(pass)) = (
                proxy_settings.username.as_deref(),
                proxy_settings.password.as_deref(),
            ) {
                proxy = proxy.basic_auth(user, pass);
            }

            if let Some(no_proxy_str) = proxy_settings
                .no_proxy
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
            {
                let no_proxy = NoProxy::from_string(no_proxy_str)
                    .with_context(|| format!(
                        "Invalid no_proxy configuration: '{}'\n\
                        Expected format: comma-separated list of domains\n\
                        Examples: localhost,127.0.0.1,.example.com",
                        no_proxy_str
                    ))?;
                proxy = proxy.no_proxy(Some(no_proxy));
            }

            builder = builder.proxy(proxy);
        }
    }

    let client = builder
        .build()
        .context("Failed to create HTTP client. This is likely due to an invalid proxy configuration or TLS setup.")?;

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
            RequestBody::Json { content } => {
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
    let response = request_builder.send().await.map_err(|e| {
        anyhow!("{}", format_request_error(&e, &request.url))
    })?;
    let duration = start.elapsed();

    let status = response.status();
    let headers: std::collections::HashMap<String, String> = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect();

    let body_bytes = response.bytes().await.map_err(|e| {
        anyhow!("Failed to read response body: {}\nThis usually indicates the connection was closed prematurely.", e)
    })?;
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

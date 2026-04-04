use crate::engines::http_engine;
use crate::models::collection::ProxySettings;
use crate::models::request::{HttpRequest, HttpResponse};
use tauri::command;

#[command]
pub async fn send_http_request(
    request: HttpRequest,
    proxy_settings: Option<ProxySettings>,
) -> Result<HttpResponse, String> {
    http_engine::send_request(request, proxy_settings)
        .await
        .map_err(|e| e.to_string())
}

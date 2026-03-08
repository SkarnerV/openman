use crate::engines::http_engine;
use crate::models::request::{HttpRequest, HttpResponse};
use tauri::command;

#[command]
pub async fn send_http_request(request: HttpRequest) -> Result<HttpResponse, String> {
    http_engine::send_request(request)
        .await
        .map_err(|e| e.to_string())
}
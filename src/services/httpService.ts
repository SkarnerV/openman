import { invoke } from "@tauri-apps/api/core";
import type { HttpRequest, HttpResponse } from "../stores";

export async function sendHttpRequest(
  request: HttpRequest,
): Promise<HttpResponse> {
  return invoke("send_http_request", { request });
}

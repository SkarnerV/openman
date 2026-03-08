import { invoke } from "@tauri-apps/api/core";
import type { HttpRequest, HttpResponse } from "../stores";

// Transform frontend request format to backend format
interface RustHttpRequest {
  id: string;
  name: string;
  description?: string;
  method: string;
  url: string;
  headers: Array<{
    key: string;
    value: string;
    description?: string;
    enabled: boolean;
  }>;
  body?: {
    mode:
      | "none"
      | "json"
      | "raw"
      | "form-data"
      | "x-www-form-urlencoded"
      | "binary";
    content?: string;
    language?: string;
  };
  auth?: {
    type: "none" | "bearer" | "basic" | "api-key";
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
    addTo?: string;
  };
  preRequestScript?: string;
  testScript?: string;
  createdAt: string;
  updatedAt: string;
}

interface RustHttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
  responseSize: number;
}

function transformRequest(request: HttpRequest): RustHttpRequest {
  const rustRequest: RustHttpRequest = {
    id: request.id,
    name: request.name,
    description: request.description,
    method: request.method,
    url: request.url,
    headers: request.headers.map((h) => ({
      key: h.key,
      value: h.value,
      description: h.description,
      enabled: h.enabled,
    })),
    preRequestScript: request.preRequestScript,
    testScript: request.testScript,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };

  // Transform body
  if (request.body && request.body.mode !== "none") {
    if (request.body.mode === "json") {
      rustRequest.body = {
        mode: "json",
        content: request.body.content,
      };
    } else if (request.body.mode === "raw") {
      rustRequest.body = {
        mode: "raw",
        content: request.body.content,
        language: request.body.rawLanguage || "text",
      };
    } else {
      rustRequest.body = {
        mode: request.body.mode,
        content: request.body.content,
      };
    }
  }

  // Transform auth
  if (request.auth && request.auth.type !== "none") {
    if (request.auth.type === "bearer") {
      rustRequest.auth = {
        type: "bearer",
        token: request.auth.token,
      };
    } else if (request.auth.type === "basic") {
      rustRequest.auth = {
        type: "basic",
        username: request.auth.username,
        password: request.auth.password,
      };
    } else if (request.auth.type === "api-key") {
      rustRequest.auth = {
        type: "api-key",
        key: request.auth.key,
        value: request.auth.value,
        addTo: request.auth.addTo,
      };
    }
  }

  return rustRequest;
}

function transformResponse(response: RustHttpResponse): HttpResponse {
  return {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    body: response.body,
    responseTime: response.responseTime,
    responseSize: response.responseSize,
  };
}

export async function sendHttpRequest(
  request: HttpRequest,
): Promise<HttpResponse> {
  const rustRequest = transformRequest(request);
  const response = await invoke<RustHttpResponse>("send_http_request", {
    request: rustRequest,
  });
  return transformResponse(response);
}

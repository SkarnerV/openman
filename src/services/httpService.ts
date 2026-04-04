import { invoke } from "@tauri-apps/api/core";
import type { HttpRequest, HttpResponse } from "../stores";
import { useEnvironmentStore } from "../stores/useEnvironmentStore";
import { useWorkspaceStore } from "../stores/useWorkspaceStore";

// Variable substitution - replaces {{variable}} with values from active environment
function substituteVariables(text: string, variables: Map<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    const value = variables.get(trimmedKey);
    return value !== undefined ? value : match;
  });
}

function getActiveVariables(): Map<string, string> {
  const variables = new Map<string, string>();
  const activeEnv = useEnvironmentStore.getState().activeEnvironment;

  if (activeEnv?.variables) {
    activeEnv.variables
      .filter((v) => v.enabled)
      .forEach((v) => {
        variables.set(v.key, v.value);
      });
  }

  return variables;
}

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

interface RustProxySettings {
  enabled: boolean;
  host: string;
  port: number;
  username?: string;
  password?: string;
  noProxy?: string;
}

function transformRequest(request: HttpRequest, variables: Map<string, string>): RustHttpRequest {
  // Apply variable substitution
  const substitutedUrl = substituteVariables(request.url, variables);

  const rustRequest: RustHttpRequest = {
    id: request.id,
    name: request.name,
    description: request.description,
    method: request.method,
    url: substitutedUrl,
    headers: request.headers.map((h) => ({
      key: h.key,
      value: substituteVariables(h.value, variables),
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
    const substitutedBody = substituteVariables(request.body.content, variables);
    if (request.body.mode === "json") {
      rustRequest.body = {
        mode: "json",
        content: substitutedBody,
      };
    } else if (request.body.mode === "xml") {
      // Map xml to raw with xml language
      rustRequest.body = {
        mode: "raw",
        content: substitutedBody,
        language: "xml",
      };
    } else if (request.body.mode === "raw") {
      rustRequest.body = {
        mode: "raw",
        content: substitutedBody,
        language: request.body.rawLanguage || "text",
      };
    } else {
      rustRequest.body = {
        mode: request.body.mode,
        content: substitutedBody,
      };
    }
  }

  // Transform auth with variable substitution
  if (request.auth && request.auth.type !== "none") {
    if (request.auth.type === "bearer") {
      rustRequest.auth = {
        type: "bearer",
        token: substituteVariables(request.auth.token, variables),
      };
    } else if (request.auth.type === "basic") {
      rustRequest.auth = {
        type: "basic",
        username: substituteVariables(request.auth.username, variables),
        password: substituteVariables(request.auth.password, variables),
      };
    } else if (request.auth.type === "api-key") {
      rustRequest.auth = {
        type: "api-key",
        key: substituteVariables(request.auth.key, variables),
        value: substituteVariables(request.auth.value, variables),
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
  const variables = getActiveVariables();
  const rustRequest = transformRequest(request, variables);
  const workspaceProxy = useWorkspaceStore.getState().currentWorkspace?.settings.proxy;
  const proxy: RustProxySettings | undefined = workspaceProxy
    ? {
      enabled: workspaceProxy.enabled,
      host: workspaceProxy.host,
      port: workspaceProxy.port,
      username: workspaceProxy.username,
      password: workspaceProxy.password,
      noProxy: workspaceProxy.noProxy,
    }
    : undefined;

  const response = await invoke<RustHttpResponse>("send_http_request", {
    request: rustRequest,
    proxy,
  });
  return transformResponse(response);
}

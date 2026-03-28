import { useState, useCallback, useEffect } from "react";
import { Send, Save, Copy, Loader2 } from "lucide-react";
import { useRequestStore } from "../stores/useRequestStore";
import { sendHttpRequest } from "../services/httpService";
import { SaveRequestModal } from "../components/common/SaveRequestModal";
import type { HttpRequest, HttpMethod, Header, QueryParam, AuthConfig } from "../stores/useRequestStore";

export function RequestBuilder() {
  const {
    currentRequest,
    response,
    isLoading,
    error,
    setCurrentRequest,
    setResponse,
    setLoading,
    setError,
    addToHistory,
  } = useRequestStore();

  const [method, setMethod] = useState<HttpMethod>(
    currentRequest?.method || "GET"
  );
  const [url, setUrl] = useState(currentRequest?.url || "");
  const [params, setParams] = useState<QueryParam[]>(
    currentRequest?.params || []
  );
  const [headers, setHeaders] = useState<Header[]>(
    currentRequest?.headers || []
  );
  const [body, setBody] = useState<string>(
    currentRequest?.body?.content || ""
  );
  const [bodyType, setBodyType] = useState<"none" | "json" | "raw">(
    (currentRequest?.body?.mode as "none" | "json" | "raw") || "none"
  );
  const [auth, setAuth] = useState<AuthConfig>(
    currentRequest?.auth || { type: "none" }
  );
  const [activeRequestTab, setActiveRequestTab] = useState<
    "params" | "headers" | "body" | "auth"
  >("params");
  const [activeResponseTab, setActiveResponseTab] = useState<
    "body" | "headers" | "cookies"
  >("body");
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Sync local state when currentRequest changes (e.g., when loading a saved request)
  useEffect(() => {
    if (currentRequest) {
      setMethod(currentRequest.method || "GET");
      setUrl(currentRequest.url || "");
      setParams(currentRequest.params || []);
      setHeaders(currentRequest.headers || []);
      setBody(currentRequest.body?.content || "");
      setBodyType((currentRequest.body?.mode as "none" | "json" | "raw") || "none");
      setAuth(currentRequest.auth || { type: "none" });
      return;
    }

    setMethod("GET");
    setUrl("");
    setParams([]);
    setHeaders([]);
    setBody("");
    setBodyType("none");
    setAuth({ type: "none" });
  }, [currentRequest]);

  const methods: HttpMethod[] = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
  ];

  const getMethodColor = (m: string) => {
    switch (m) {
      case "GET":
        return "bg-get-method text-text-on-accent";
      case "POST":
        return "bg-post-method text-text-on-accent";
      case "PUT":
        return "bg-put-method text-text-on-accent";
      case "PATCH":
        return "bg-put-method text-text-on-accent";
      case "DELETE":
        return "bg-delete-method text-text-on-accent";
      default:
        return "bg-text-secondary text-text-primary";
    }
  };

  // Build URL with query params
  const buildUrlWithParams = useCallback(() => {
    if (!url) return "";
    try {
      const urlObj = new URL(url);
      // Clear existing search params
      urlObj.search = "";
      // Add enabled params
      params
        .filter((p) => p.enabled && p.key)
        .forEach((p) => {
          urlObj.searchParams.append(p.key, p.value);
        });
      return urlObj.toString();
    } catch {
      // If URL is invalid, just return as-is
      return url;
    }
  }, [url, params]);

  const handleSendRequest = useCallback(async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);

    const finalUrl = buildUrlWithParams();

    const request: HttpRequest = {
      id: crypto.randomUUID(),
      name: url,
      method,
      url: finalUrl,
      params,
      headers: headers.filter((h) => h.enabled && h.key),
      body:
        bodyType !== "none" && body
          ? { mode: bodyType, content: body }
          : undefined,
      auth,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentRequest(request);

    try {
      const result = await sendHttpRequest(request);
      setResponse(result);
      addToHistory(request);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [
    url,
    method,
    params,
    headers,
    body,
    bodyType,
    auth,
    buildUrlWithParams,
    setCurrentRequest,
    setLoading,
    setError,
    setResponse,
    addToHistory,
  ]);

  // Params handlers
  const addParam = () => {
    setParams([...params, { key: "", value: "", enabled: true }]);
  };

  const updateParam = (
    index: number,
    field: keyof QueryParam,
    value: string | boolean
  ) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: value };
    setParams(newParams);
  };

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index));
  };

  // Header handlers
  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "", enabled: true }]);
  };

  const updateHeader = (
    index: number,
    field: keyof Header,
    value: string | boolean
  ) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const formatJson = (json: string): string => {
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden p-6">
      {/* URL Bar */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className={`px-4 py-3 rounded-radius font-semibold font-mono text-sm ${getMethodColor(method)} cursor-pointer`}
        >
          {methods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter request URL (e.g., https://api.example.com/users)"
          className="flex-1 px-4 py-3 rounded-radius bg-card-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange"
          onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
        />
        <button
          onClick={handleSendRequest}
          disabled={isLoading || !url}
          className="flex items-center gap-2 px-6 py-3 bg-accent-orange text-text-on-accent rounded-radius font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          Send
        </button>
        <button
          onClick={() => setShowSaveModal(true)}
          className="p-3 rounded-radius hover:bg-card-bg"
          title="Save Request"
        >
          <Save className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-3 mb-4 bg-delete-method/10 text-delete-method rounded-radius text-sm">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Request Panel */}
        <div className="flex-1 flex flex-col bg-card-bg rounded-radius p-4">
          {/* Request Tabs */}
          <div className="flex gap-1 mb-4 p-1 bg-elevated-bg rounded-radius">
            {(["params", "headers", "body", "auth"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveRequestTab(tab)}
                className={`px-4 py-2 text-sm rounded-radius transition-colors capitalize ${
                  activeRequestTab === tab
                    ? "bg-card-bg text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab}
                {tab === "params" && params.filter((p) => p.enabled && p.key).length > 0 && (
                  <span className="ml-1 text-xs text-accent-teal">
                    ({params.filter((p) => p.enabled && p.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Request Content */}
          <div className="flex-1 overflow-auto">
            {/* Params Tab */}
            {activeRequestTab === "params" && (
              <div className="text-sm">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-text-secondary">Query Parameters</p>
                  <button
                    onClick={addParam}
                    className="text-xs text-accent-orange hover:underline"
                  >
                    + Add Parameter
                  </button>
                </div>
                <div className="space-y-2">
                  {params.map((param, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={param.enabled}
                        onChange={(e) =>
                          updateParam(index, "enabled", e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                      <input
                        type="text"
                        value={param.key}
                        onChange={(e) =>
                          updateParam(index, "key", e.target.value)
                        }
                        placeholder="Parameter name"
                        className="flex-1 px-3 py-2 bg-elevated-bg rounded-radius text-sm"
                      />
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) =>
                          updateParam(index, "value", e.target.value)
                        }
                        placeholder="Value"
                        className="flex-1 px-3 py-2 bg-elevated-bg rounded-radius text-sm"
                      />
                      <button
                        onClick={() => removeParam(index)}
                        className="text-text-secondary hover:text-delete-method"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {params.length === 0 && (
                    <p className="text-text-secondary text-xs">
                      No parameters added. Click "Add Parameter" to add query params to your URL.
                    </p>
                  )}
                </div>
                {params.filter((p) => p.enabled && p.key).length > 0 && (
                  <div className="mt-4 p-3 bg-elevated-bg rounded-radius">
                    <p className="text-xs text-text-secondary mb-1">Preview:</p>
                    <code className="text-xs text-accent-teal break-all">
                      {buildUrlWithParams()}
                    </code>
                  </div>
                )}
              </div>
            )}

            {/* Headers Tab */}
            {activeRequestTab === "headers" && (
              <div className="text-sm">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-text-secondary">Headers</p>
                  <button
                    onClick={addHeader}
                    className="text-xs text-accent-orange hover:underline"
                  >
                    + Add Header
                  </button>
                </div>
                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={header.enabled}
                        onChange={(e) =>
                          updateHeader(index, "enabled", e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) =>
                          updateHeader(index, "key", e.target.value)
                        }
                        placeholder="Header name"
                        className="flex-1 px-3 py-2 bg-elevated-bg rounded-radius text-sm"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) =>
                          updateHeader(index, "value", e.target.value)
                        }
                        placeholder="Value"
                        className="flex-1 px-3 py-2 bg-elevated-bg rounded-radius text-sm"
                      />
                      <button
                        onClick={() => removeHeader(index)}
                        className="text-text-secondary hover:text-delete-method"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {headers.length === 0 && (
                    <p className="text-text-secondary text-xs">
                      No headers added. Click "Add Header" to add one.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Body Tab */}
            {activeRequestTab === "body" && (
              <div className="text-sm">
                <div className="flex gap-4 mb-3">
                  {(["none", "json", "raw"] as const).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bodyType"
                        value={type}
                        checked={bodyType === type}
                        onChange={() => setBodyType(type)}
                        className="w-4 h-4"
                      />
                      <span className="capitalize">{type}</span>
                    </label>
                  ))}
                </div>
                {bodyType !== "none" && (
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={
                      bodyType === "json"
                        ? '{\n  "key": "value"\n}'
                        : "Request body"
                    }
                    className="w-full h-64 p-3 bg-elevated-bg rounded-radius font-mono text-xs resize-none focus:outline-none"
                  />
                )}
              </div>
            )}

            {/* Auth Tab */}
            {activeRequestTab === "auth" && (
              <div className="text-sm">
                <div className="mb-4">
                  <label className="block mb-2 text-text-secondary">
                    Auth Type
                  </label>
                  <select
                    value={auth.type}
                    onChange={(e) => {
                      const type = e.target.value as AuthConfig["type"];
                      if (type === "none") setAuth({ type: "none" });
                      else if (type === "bearer") setAuth({ type: "bearer", token: "" });
                      else if (type === "basic") setAuth({ type: "basic", username: "", password: "" });
                      else if (type === "api-key") setAuth({ type: "api-key", key: "", value: "", addTo: "header" });
                    }}
                    className="w-full px-3 py-2 bg-elevated-bg rounded-radius"
                  >
                    <option value="none">No Auth</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="api-key">API Key</option>
                  </select>
                </div>

                {auth.type === "bearer" && (
                  <div className="mb-4">
                    <label className="block mb-2 text-text-secondary">Token</label>
                    <input
                      type="password"
                      value={"token" in auth ? auth.token : ""}
                      onChange={(e) => setAuth({ type: "bearer", token: e.target.value })}
                      placeholder="Enter bearer token"
                      className="w-full px-3 py-2 bg-elevated-bg rounded-radius"
                    />
                  </div>
                )}

                {auth.type === "basic" && (
                  <>
                    <div className="mb-4">
                      <label className="block mb-2 text-text-secondary">Username</label>
                      <input
                        type="text"
                        value={"username" in auth ? auth.username : ""}
                        onChange={(e) => setAuth({ ...auth, username: e.target.value } as AuthConfig)}
                        placeholder="Enter username"
                        className="w-full px-3 py-2 bg-elevated-bg rounded-radius"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2 text-text-secondary">Password</label>
                      <input
                        type="password"
                        value={"password" in auth ? auth.password : ""}
                        onChange={(e) => setAuth({ ...auth, password: e.target.value } as AuthConfig)}
                        placeholder="Enter password"
                        className="w-full px-3 py-2 bg-elevated-bg rounded-radius"
                      />
                    </div>
                  </>
                )}

                {auth.type === "api-key" && (
                  <>
                    <div className="mb-4">
                      <label className="block mb-2 text-text-secondary">Key</label>
                      <input
                        type="text"
                        value={"key" in auth ? auth.key : ""}
                        onChange={(e) => setAuth({ ...auth, key: e.target.value } as AuthConfig)}
                        placeholder="API key name"
                        className="w-full px-3 py-2 bg-elevated-bg rounded-radius"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2 text-text-secondary">Value</label>
                      <input
                        type="text"
                        value={"value" in auth ? auth.value : ""}
                        onChange={(e) => setAuth({ ...auth, value: e.target.value } as AuthConfig)}
                        placeholder="API key value"
                        className="w-full px-3 py-2 bg-elevated-bg rounded-radius"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2 text-text-secondary">Add to</label>
                      <select
                        value={"addTo" in auth ? auth.addTo : "header"}
                        onChange={(e) => setAuth({ ...auth, addTo: e.target.value as "header" | "query" } as AuthConfig)}
                        className="w-full px-3 py-2 bg-elevated-bg rounded-radius"
                      >
                        <option value="header">Header</option>
                        <option value="query">Query Parameter</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Response Panel */}
        <div className="flex-1 flex flex-col bg-card-bg rounded-radius p-4">
          {/* Response Tabs */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 p-1 bg-elevated-bg rounded-radius">
              {(["body", "headers", "cookies"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveResponseTab(tab)}
                  className={`px-4 py-2 text-sm rounded-radius transition-colors capitalize ${
                    activeResponseTab === tab
                      ? "bg-card-bg text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {response && (
              <button
                onClick={() => navigator.clipboard.writeText(response.body)}
                className="p-2 rounded-radius hover:bg-elevated-bg"
                title="Copy Response"
              >
                <Copy className="w-4 h-4 text-text-secondary" />
              </button>
            )}
          </div>

          {/* Response Content */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
              </div>
            ) : response ? (
              <>
                {activeResponseTab === "body" && (
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs bg-elevated-bg p-4 rounded-radius overflow-auto max-h-96">
                    {formatJson(response.body)}
                  </pre>
                )}
                {activeResponseTab === "headers" && (
                  <div className="text-sm">
                    <div className="space-y-1">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium text-text-secondary">
                            {key}:
                          </span>
                          <span className="break-all">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeResponseTab === "cookies" && (
                  <div className="text-sm text-text-secondary">
                    <p>Cookie support coming soon.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-text-secondary">
                <p>No response yet. Send a request to see the response.</p>
              </div>
            )}
          </div>

          {/* Response Status Bar */}
          {response && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-elevated-bg text-xs text-text-secondary">
              <span
                className={`font-medium ${
                  response.status >= 200 && response.status < 300
                    ? "text-success"
                    : response.status >= 400
                      ? "text-error"
                      : "text-warning"
                }`}
              >
                Status: {response.status} {response.statusText}
              </span>
              <span>Time: {response.responseTime} ms</span>
              <span>Size: {response.responseSize} B</span>
            </div>
          )}
        </div>
      </div>

      {/* Save Request Modal */}
      <SaveRequestModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        request={{
          id: crypto.randomUUID(),
          name: url,
          method,
          url: buildUrlWithParams(),
          params,
          headers: headers.filter((h) => h.enabled && h.key),
          body: bodyType !== "none" && body ? { mode: bodyType, content: body } : undefined,
          auth,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }}
      />
    </div>
  );
}

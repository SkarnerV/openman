import { useState, useCallback } from "react";
import { Send, Save, Copy, Loader2, Terminal } from "lucide-react";
import { useRequestStore } from "../../stores/useRequestStore";
import { sendHttpRequest } from "../../services/httpService";
import { generateCurlCommand } from "../../utils/curlParser";
import type {
  HttpRequest,
  HttpMethod,
  Header,
} from "../../stores/useRequestStore";

export function HttpPanel() {
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

  // Local state for the request being edited
  const [method, setMethod] = useState<HttpMethod>(
    currentRequest?.method || "GET",
  );
  const [url, setUrl] = useState(currentRequest?.url || "");
  const [headers, setHeaders] = useState<Header[]>(
    currentRequest?.headers || [],
  );
  const [body, setBody] = useState<string>(currentRequest?.body?.content || "");
  const [bodyType, setBodyType] = useState<"none" | "json" | "raw">(
    (currentRequest?.body?.mode as "none" | "json" | "raw") || "none",
  );
  const [activeRequestTab, setActiveRequestTab] = useState<
    "params" | "headers" | "body" | "auth"
  >("params");
  const [activeResponseTab, setActiveResponseTab] = useState<
    "body" | "headers" | "cookies"
  >("body");

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
        return "text-green-500";
      case "POST":
        return "text-yellow-500";
      case "PUT":
        return "text-blue-500";
      case "PATCH":
        return "text-purple-500";
      case "DELETE":
        return "text-red-500";
      default:
        return "text-foreground";
    }
  };

  const handleSendRequest = useCallback(async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);

    const request: HttpRequest = {
      id: crypto.randomUUID(),
      name: url,
      method,
      url,
      headers: headers.filter((h) => h.enabled && h.key),
      body:
        bodyType !== "none" && body
          ? { mode: bodyType, content: body }
          : undefined,
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
    headers,
    body,
    bodyType,
    setCurrentRequest,
    setLoading,
    setError,
    setResponse,
    addToHistory,
  ]);

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "", enabled: true }]);
  };

  const updateHeader = (
    index: number,
    field: keyof Header,
    value: string | boolean,
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Request Bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className={`px-3 py-1.5 rounded border border-border bg-background font-medium ${getMethodColor(method)}`}
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
          className="flex-1 px-3 py-1.5 rounded border border-border bg-background text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
        />
        <button
          onClick={handleSendRequest}
          disabled={isLoading || !url}
          className="flex items-center gap-1 px-4 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send
        </button>
        <button
          className="p-1.5 rounded hover:bg-muted/50"
          title="Save Request"
        >
          <Save className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => {
            const curlCommand = generateCurlCommand({
              method,
              url,
              headers,
              body: bodyType !== "none" && body ? { mode: bodyType, content: body } : undefined,
            });
            navigator.clipboard.writeText(curlCommand);
          }}
          className="p-1.5 rounded hover:bg-muted/50"
          title="Copy as cURL"
        >
          <Terminal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-b border-border">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Request Panel */}
        <div className="flex-1 flex flex-col border-r border-border">
          {/* Request Tabs */}
          <div className="flex border-b border-border">
            {(["params", "headers", "body", "auth"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveRequestTab(tab)}
                className={`px-4 py-2 text-sm capitalize transition-colors ${
                  activeRequestTab === tab
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Request Content */}
          <div className="flex-1 p-4 overflow-auto">
            {activeRequestTab === "params" && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-2">Query Parameters</p>
                <p className="text-xs text-muted-foreground">
                  Add query parameters to the URL. They will be appended to the
                  URL automatically.
                </p>
              </div>
            )}
            {activeRequestTab === "headers" && (
              <div className="text-sm">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-muted-foreground">Headers</p>
                  <button
                    onClick={addHeader}
                    className="text-xs text-primary hover:underline"
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
                        className="flex-1 px-2 py-1 border border-border rounded bg-background text-sm"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) =>
                          updateHeader(index, "value", e.target.value)
                        }
                        placeholder="Value"
                        className="flex-1 px-2 py-1 border border-border rounded bg-background text-sm"
                      />
                      <button
                        onClick={() => removeHeader(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {headers.length === 0 && (
                    <p className="text-muted-foreground text-xs">
                      No headers added. Click "Add Header" to add one.
                    </p>
                  )}
                </div>
              </div>
            )}
            {activeRequestTab === "body" && (
              <div className="text-sm">
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="bodyType"
                      value="none"
                      checked={bodyType === "none"}
                      onChange={() => setBodyType("none")}
                    />
                    None
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="bodyType"
                      value="json"
                      checked={bodyType === "json"}
                      onChange={() => setBodyType("json")}
                    />
                    JSON
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="bodyType"
                      value="raw"
                      checked={bodyType === "raw"}
                      onChange={() => setBodyType("raw")}
                    />
                    Raw
                  </label>
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
                    className="w-full h-64 p-2 border border-border rounded bg-background font-mono text-xs"
                  />
                )}
              </div>
            )}
            {activeRequestTab === "auth" && (
              <div className="text-sm">
                <div className="mb-4">
                  <label className="block mb-1 text-muted-foreground">
                    Auth Type
                  </label>
                  <select className="w-full px-2 py-1 border border-border rounded bg-background">
                    <option value="none">No Auth</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="api-key">API Key</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Authentication settings will be added in a future update.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Response Panel */}
        <div className="flex-1 flex flex-col">
          {/* Response Tabs */}
          <div className="flex items-center justify-between border-b border-border">
            <div className="flex">
              {(["body", "headers", "cookies"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveResponseTab(tab)}
                  className={`px-4 py-2 text-sm capitalize transition-colors ${
                    activeResponseTab === tab
                      ? "text-primary border-b-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {response && (
              <button
                onClick={() => navigator.clipboard.writeText(response.body)}
                className="p-1.5 rounded hover:bg-muted/50 mr-2"
                title="Copy Response"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Response Content */}
          <div className="flex-1 p-4 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : response ? (
              <>
                {activeResponseTab === "body" && (
                  <div className="text-sm">
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs bg-muted/30 p-3 rounded overflow-auto max-h-96">
                      {formatJson(response.body)}
                    </pre>
                  </div>
                )}
                {activeResponseTab === "headers" && (
                  <div className="text-sm">
                    <div className="space-y-1">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium text-muted-foreground">
                            {key}:
                          </span>
                          <span className="break-all">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeResponseTab === "cookies" && (
                  <div className="text-sm text-muted-foreground">
                    <p>Cookie support coming soon.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                <p>No response yet. Send a request to see the response.</p>
              </div>
            )}
          </div>

          {/* Response Status Bar */}
          {response && (
            <div className="h-8 flex items-center px-4 border-t border-border text-xs text-muted-foreground">
              <span
                className={`font-medium ${
                  response.status >= 200 && response.status < 300
                    ? "text-green-500"
                    : response.status >= 400
                      ? "text-red-500"
                      : "text-yellow-500"
                }`}
              >
                Status: {response.status} {response.statusText}
              </span>
              <span className="mx-4">|</span>
              <span>Time: {response.responseTime} ms</span>
              <span className="mx-4">|</span>
              <span>Size: {response.responseSize} B</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

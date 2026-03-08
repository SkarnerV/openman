import { useState } from "react";
import { Send, Save, Copy } from "lucide-react";

export function HttpPanel() {
  const [method, setMethod] = useState<
    "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  >("GET");
  const [url, setUrl] = useState("");
  const [activeRequestTab, setActiveRequestTab] = useState<
    "params" | "headers" | "body" | "auth"
  >("params");
  const [activeResponseTab, setActiveResponseTab] = useState<
    "body" | "headers" | "cookies"
  >("body");

  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Request Bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as typeof method)}
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
          placeholder="Enter request URL"
          className="flex-1 px-3 py-1.5 rounded border border-border bg-background text-sm"
        />
        <button className="flex items-center gap-1 px-4 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
          <Send className="w-4 h-4" />
          Send
        </button>
        <button
          className="p-1.5 rounded hover:bg-muted/50"
          title="Save Request"
        >
          <Save className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

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
              <div className="text-sm text-muted-foreground">
                <p>Query Parameters</p>
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Key"
                      className="flex-1 px-2 py-1 border border-border rounded bg-background"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      className="flex-1 px-2 py-1 border border-border rounded bg-background"
                    />
                  </div>
                </div>
              </div>
            )}
            {activeRequestTab === "headers" && (
              <div className="text-sm text-muted-foreground">
                <p>Headers</p>
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Key"
                      className="flex-1 px-2 py-1 border border-border rounded bg-background"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      className="flex-1 px-2 py-1 border border-border rounded bg-background"
                    />
                  </div>
                </div>
              </div>
            )}
            {activeRequestTab === "body" && (
              <div className="text-sm text-muted-foreground">
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="bodyType"
                      value="none"
                      defaultChecked
                    />
                    None
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="bodyType" value="json" />
                    JSON
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="bodyType" value="form" />
                    Form Data
                  </label>
                </div>
                <textarea
                  placeholder="Request body"
                  className="w-full h-48 p-2 border border-border rounded bg-background font-mono text-xs"
                />
              </div>
            )}
            {activeRequestTab === "auth" && (
              <div className="text-sm text-muted-foreground">
                <div className="mb-2">
                  <label className="block mb-1">Auth Type</label>
                  <select className="w-full px-2 py-1 border border-border rounded bg-background">
                    <option value="none">No Auth</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="api-key">API Key</option>
                  </select>
                </div>
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
            <button
              className="p-1.5 rounded hover:bg-muted/50 mr-2"
              title="Copy Response"
            >
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Response Content */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="text-sm text-muted-foreground">
              <p>No response yet. Send a request to see the response.</p>
            </div>
          </div>

          {/* Response Status Bar */}
          <div className="h-8 flex items-center px-4 border-t border-border text-xs text-muted-foreground">
            <span>Status: --</span>
            <span className="mx-4">|</span>
            <span>Time: -- ms</span>
            <span className="mx-4">|</span>
            <span>Size: -- B</span>
          </div>
        </div>
      </div>
    </div>
  );
}

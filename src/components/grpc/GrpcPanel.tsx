import { useState } from "react";
import { Upload, Send, RefreshCw } from "lucide-react";

export function GrpcPanel() {
  const [serverAddress, setServerAddress] = useState("");
  const [activeTab, setActiveTab] = useState<
    "services" | "request" | "response"
  >("services");

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Server Connection Bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card">
        <input
          type="text"
          value={serverAddress}
          onChange={(e) => setServerAddress(e.target.value)}
          placeholder="Server address (e.g., localhost:50051)"
          className="flex-1 px-3 py-1.5 rounded border border-border bg-background text-sm"
        />
        <button className="flex items-center gap-1 px-4 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Connect
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Proto Files Panel */}
        <div className="w-64 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">Proto Files</span>
            <button
              className="p-1 rounded hover:bg-muted/50"
              title="Import Proto"
            >
              <Upload className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 p-3 overflow-auto text-sm text-muted-foreground">
            <p>Import .proto files to see services</p>
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["services", "request", "response"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-auto">
            {activeTab === "services" && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Services will be listed here after connecting to a server or
                  loading proto files.
                </p>
              </div>
            )}
            {activeTab === "request" && (
              <div className="text-sm text-muted-foreground">
                <div className="mb-4">
                  <label className="block mb-1">Method</label>
                  <select className="w-full px-2 py-1 border border-border rounded bg-background">
                    <option value="">Select a method</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Message (JSON)</label>
                  <textarea
                    placeholder="{}"
                    className="w-full h-48 p-2 border border-border rounded bg-background font-mono text-xs"
                  />
                </div>
                <button className="flex items-center gap-1 px-4 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                  <Send className="w-4 h-4" />
                  Invoke
                </button>
              </div>
            )}
            {activeTab === "response" && (
              <div className="text-sm text-muted-foreground">
                <p>Response will appear here after invoking a method.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

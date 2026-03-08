import { useState } from "react";
import { Plus, Play, FileText, MessageSquare, Send } from "lucide-react";

interface McpConnection {
  id: string;
  name: string;
  status: "disconnected" | "connecting" | "connected" | "error";
}

export function McpPanel() {
  const [activeTab, setActiveTab] = useState<"tools" | "resources" | "prompts">(
    "tools",
  );
  const [connections] = useState<McpConnection[]>([]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Server Connections Bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card">
        <select className="flex-1 px-3 py-1.5 rounded border border-border bg-background text-sm">
          <option value="">Select MCP Server</option>
        </select>
        <button className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors">
          <Plus className="w-4 h-4" />
          Add Server
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Connections Panel */}
        <div className="w-64 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <span className="text-sm font-medium">MCP Servers</span>
          </div>
          <div className="flex-1 p-3 overflow-auto">
            {connections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No MCP servers configured. Click "Add Server" to add one.
              </p>
            ) : (
              <div className="space-y-2">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="p-2 border border-border rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="text-sm font-medium">{conn.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {conn.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["tools", "resources", "prompts"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1 px-4 py-2 text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {tab === "tools" && <Play className="w-3 h-3" />}
                {tab === "resources" && <FileText className="w-3 h-3" />}
                {tab === "prompts" && <MessageSquare className="w-3 h-3" />}
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-auto">
            {activeTab === "tools" && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Tools available from the MCP server will be listed here.
                  Connect to a server to see tools.
                </p>
                <div className="mt-4 p-4 border border-dashed border-border rounded">
                  <div className="mb-4">
                    <label className="block mb-1">Tool Name</label>
                    <select className="w-full px-2 py-1 border border-border rounded bg-background">
                      <option value="">Select a tool</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1">Arguments (JSON)</label>
                    <textarea
                      placeholder="{}"
                      className="w-full h-32 p-2 border border-border rounded bg-background font-mono text-xs"
                    />
                  </div>
                  <button className="flex items-center gap-1 px-4 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                    <Send className="w-4 h-4" />
                    Invoke Tool
                  </button>
                </div>
              </div>
            )}
            {activeTab === "resources" && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Resources available from the MCP server will be listed here.
                </p>
              </div>
            )}
            {activeTab === "prompts" && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Prompts available from the MCP server will be listed here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

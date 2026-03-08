import {
  Globe,
  Settings,
  FolderOpen,
  Clock,
  ChevronDown,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useRequestStore } from "../../stores/useRequestStore";
import type { HttpRequest } from "../../stores/useRequestStore";

interface SidebarProps {
  activeTab: "http" | "grpc" | "mcp";
  onTabChange: (tab: "http" | "grpc" | "mcp") => void;
  onSelectRequest?: (request: HttpRequest) => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  onSelectRequest,
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    collections: true,
    history: true,
  });

  const { requestHistory, clearHistory } = useRequestStore();

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getMethodColor = (method: string) => {
    switch (method) {
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
        return "text-muted-foreground";
    }
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  };

  const handleHistoryItemClick = (request: HttpRequest) => {
    if (onSelectRequest) {
      onSelectRequest(request);
    }
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Logo and App Name */}
      <div className="h-12 flex items-center px-4 border-b border-border">
        <Globe className="w-6 h-6 text-primary mr-2" />
        <span className="font-semibold text-lg">Openman</span>
      </div>

      {/* Protocol Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => onTabChange("http")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === "http"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          HTTP
        </button>
        <button
          onClick={() => onTabChange("grpc")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === "grpc"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          gRPC
        </button>
        <button
          onClick={() => onTabChange("mcp")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === "mcp"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          MCP
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-b border-border">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {/* Collections Section */}
      <div className="flex-1 overflow-auto">
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection("collections")}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              Collections
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                expandedSections.collections ? "" : "-rotate-90"
              }`}
            />
          </button>
          {expandedSections.collections && (
            <div className="pb-2">
              <div className="px-4 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer">
                No collections yet
              </div>
            </div>
          )}
        </div>

        {/* History Section */}
        <div>
          <button
            onClick={() => toggleSection("history")}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              History
              {requestHistory.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({requestHistory.length})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {requestHistory.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearHistory();
                  }}
                  className="p-1 rounded hover:bg-muted/50"
                  title="Clear History"
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  expandedSections.history ? "" : "-rotate-90"
                }`}
              />
            </div>
          </button>
          {expandedSections.history && (
            <div className="pb-2 max-h-64 overflow-auto">
              {requestHistory.length === 0 ? (
                <div className="px-4 py-1.5 text-sm text-muted-foreground">
                  No history yet
                </div>
              ) : (
                requestHistory.map((request) => (
                  <div
                    key={request.id}
                    onClick={() => handleHistoryItemClick(request)}
                    className="px-3 py-1.5 text-sm hover:bg-muted/50 cursor-pointer flex items-center gap-2 group"
                  >
                    <span
                      className={`font-mono text-xs ${getMethodColor(request.method)}`}
                    >
                      {request.method.padEnd(6)}
                    </span>
                    <span
                      className="truncate text-xs flex-1"
                      title={request.url}
                    >
                      {formatUrl(request.url)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="h-10 flex items-center justify-between px-3 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Environment:</span>
          <span className="text-xs font-medium">None</span>
        </div>
        <button className="p-1.5 rounded hover:bg-muted/50">
          <Settings className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

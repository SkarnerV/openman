import {
  Globe,
  Settings,
  FolderOpen,
  Clock,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  activeTab: "http" | "grpc" | "mcp";
  onTabChange: (tab: "http" | "grpc" | "mcp") => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    collections: true,
    history: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
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
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                expandedSections.history ? "" : "-rotate-90"
              }`}
            />
          </button>
          {expandedSections.history && (
            <div className="pb-2">
              <div className="px-4 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer">
                No history yet
              </div>
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

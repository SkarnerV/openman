import {
  Globe,
  Settings,
  FolderOpen,
  Clock,
  ChevronDown,
  Plus,
  Trash2,
  FolderPlus,
  FileJson,
} from "lucide-react";
import { useState } from "react";
import { useRequestStore } from "../../stores/useRequestStore";
import { useCollectionStore } from "../../stores/useCollectionStore";
import type { HttpRequest } from "../../stores/useRequestStore";
import type { Collection } from "../../stores/useCollectionStore";

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

  const [expandedCollections, setExpandedCollections] = useState<
    Record<string, boolean>
  >({});

  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  const { requestHistory, clearHistory } = useRequestStore();
  const { collections, addCollection, removeCollection, setSelectedRequest } =
    useCollectionStore();

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections((prev) => ({
      ...prev,
      [collectionId]: !prev[collectionId],
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

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    const collection: Collection = {
      id: crypto.randomUUID(),
      name: newCollectionName.trim(),
      items: [],
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addCollection(collection);
    setNewCollectionName("");
    setShowNewCollectionModal(false);
  };

  const handleCollectionItemClick = (request: HttpRequest) => {
    setSelectedRequest(request);
    if (onSelectRequest) {
      onSelectRequest(request);
    }
  };

  const isRequestItem = (item: unknown): item is HttpRequest => {
    return (item as HttpRequest).method !== undefined;
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
              {collections.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({collections.length})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNewCollectionModal(true);
                }}
                className="p-1 rounded hover:bg-muted/50"
                title="New Collection"
              >
                <FolderPlus className="w-3 h-3 text-muted-foreground" />
              </button>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  expandedSections.collections ? "" : "-rotate-90"
                }`}
              />
            </div>
          </button>
          {expandedSections.collections && (
            <div className="pb-2">
              {collections.length === 0 ? (
                <div className="px-4 py-1.5 text-sm text-muted-foreground">
                  No collections yet
                </div>
              ) : (
                collections.map((collection) => (
                  <div key={collection.id}>
                    <div
                      className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/50 cursor-pointer group"
                      onClick={() => toggleCollection(collection.id)}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          className={`w-3 h-3 text-muted-foreground transition-transform ${
                            expandedCollections[collection.id]
                              ? ""
                              : "-rotate-90"
                          }`}
                        />
                        <FileJson className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm truncate">
                          {collection.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCollection(collection.id);
                        }}
                        className="p-1 rounded hover:bg-muted/50 opacity-0 group-hover:opacity-100"
                        title="Delete Collection"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    {expandedCollections[collection.id] && (
                      <div className="ml-6">
                        {collection.items.length === 0 ? (
                          <div className="px-4 py-1 text-xs text-muted-foreground">
                            Empty collection
                          </div>
                        ) : (
                          collection.items.map((item) => {
                            if (isRequestItem(item)) {
                              return (
                                <div
                                  key={item.id}
                                  onClick={() =>
                                    handleCollectionItemClick(item)
                                  }
                                  className="px-3 py-1 text-sm hover:bg-muted/50 cursor-pointer flex items-center gap-2"
                                >
                                  <span
                                    className={`font-mono text-xs ${getMethodColor(item.method)}`}
                                  >
                                    {item.method.padEnd(6)}
                                  </span>
                                  <span
                                    className="truncate text-xs flex-1"
                                    title={item.url}
                                  >
                                    {formatUrl(item.url)}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
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

      {/* New Collection Modal */}
      {showNewCollectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-4 w-80">
            <h3 className="text-lg font-medium mb-4">New Collection</h3>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="w-full px-3 py-2 border border-border rounded bg-background text-sm mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateCollection();
                if (e.key === "Escape") setShowNewCollectionModal(false);
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewCollectionModal(false)}
                className="px-3 py-1.5 text-sm rounded border border-border hover:bg-muted/50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollection}
                className="px-3 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

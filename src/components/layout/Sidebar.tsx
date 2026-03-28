import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronDown,
  FolderOpen,
  ChevronRight,
  Globe,
} from "lucide-react";
import { useCollectionStore, type Collection } from "../../stores/useCollectionStore";
import { useRequestStore, type HttpRequest } from "../../stores/useRequestStore";
import { type CollectionItem, type RequestCollectionItem } from "../../services/storageService";
import { CreateCollectionModal } from "../common/CreateCollectionModal";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { useSettingsStore } from "../../stores/useSettingsStore";

export function Sidebar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "collection" | "request";
    collectionId: string;
    requestId?: string;
    name: string;
  } | null>(null);
  const { sidebarVisible } = useSettingsStore();

  const { collections, createCollection, deleteCollection, deleteRequestFromCollection } = useCollectionStore();
  const { setCurrentRequest, setResponse, setError } = useRequestStore();

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections((prev) => ({
      ...prev,
      [collectionId]: !prev[collectionId],
    }));
  };

  const handleSelectRequest = (request: HttpRequest) => {
    setCurrentRequest(request);
    navigate("/request");
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "text-get-method";
      case "POST":
        return "text-post-method";
      case "PUT":
        return "text-put-method";
      case "PATCH":
        return "text-put-method";
      case "DELETE":
        return "text-delete-method";
      default:
        return "text-text-secondary";
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

  const handleCreateCollection = async (name: string, description?: string) => {
    await createCollection(name, description);
  };

  const handleDeleteCollection = async (collectionId: string) => {
    await deleteCollection(collectionId);
    setDeleteConfirm(null);
  };

  const handleDeleteRequest = async (collectionId: string, requestId: string) => {
    await deleteRequestFromCollection(collectionId, requestId);
    setDeleteConfirm(null);
  };

  const isRequestItem = (item: CollectionItem): item is HttpRequest | RequestCollectionItem => {
    return "method" in item && ("type" in item ? item.type === "request" : true);
  };

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!sidebarVisible) {
    return null;
  }

  return (
    <>
      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCollection}
      />
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title={deleteConfirm?.type === "collection" ? "Delete Collection" : "Delete Request"}
        message={
          deleteConfirm?.type === "collection"
            ? `Are you sure you want to delete "${deleteConfirm?.name}"? This will also delete all requests in this collection.`
            : `Are you sure you want to delete "${deleteConfirm?.name}"?`
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteConfirm?.type === "collection") {
            handleDeleteCollection(deleteConfirm.collectionId);
          } else if (deleteConfirm?.type === "request" && deleteConfirm.requestId) {
            handleDeleteRequest(deleteConfirm.collectionId, deleteConfirm.requestId);
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
      <div className="w-[260px] h-full bg-page-bg flex flex-col border-r border-elevated-bg">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="w-8 h-8 rounded-lg bg-accent-orange flex items-center justify-center">
          <Globe className="w-5 h-5 text-text-on-accent" />
        </div>
        <span className="font-semibold text-lg font-display">Openman</span>
      </div>

      {/* Search */}
      <div className="px-3 mb-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-card-bg rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange"
          />
        </div>
      </div>

      {/* New Request Button */}
      <div className="px-3 mb-4">
        <button
          onClick={() => {
            setCurrentRequest(null);
            setResponse(null);
            setError(null);
            navigate("/request");
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-orange text-text-on-accent rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {/* Collections Section */}
      <div className="px-3 mb-2">
        <div className="flex items-center justify-between py-2">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Collections
          </span>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="p-1 hover:bg-elevated-bg rounded transition-colors"
            title="New Collection"
          >
            <Plus className="w-3 h-3 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-auto px-3">
        {filteredCollections.length === 0 ? (
          <div className="text-sm text-text-secondary py-2">
            {searchQuery ? "No collections found" : "No collections yet"}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredCollections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                isExpanded={expandedCollections[collection.id]}
                onToggle={() => toggleCollection(collection.id)}
                onDelete={() => setDeleteConfirm({
                  type: "collection",
                  collectionId: collection.id,
                  name: collection.name,
                })}
                onSelectRequest={handleSelectRequest}
                onDeleteRequest={(requestId, requestName) => setDeleteConfirm({
                  type: "request",
                  collectionId: collection.id,
                  requestId,
                  name: requestName,
                })}
                getMethodColor={getMethodColor}
                formatUrl={formatUrl}
                isRequestItem={isRequestItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  </>
  );
}

interface CollectionItemProps {
  collection: Collection;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSelectRequest: (request: HttpRequest) => void;
  onDeleteRequest: (requestId: string, requestName: string) => void;
  getMethodColor: (method: string) => string;
  formatUrl: (url: string) => string;
  isRequestItem: (item: CollectionItem) => item is HttpRequest | RequestCollectionItem;
}

function CollectionItem({
  collection,
  isExpanded,
  onToggle,
  onDelete,
  onSelectRequest,
  onDeleteRequest,
  getMethodColor,
  formatUrl,
  isRequestItem,
}: CollectionItemProps) {
  return (
    <div className="group">
      <div
        className="flex items-center gap-1 py-1.5 px-2 rounded hover:bg-elevated-bg cursor-pointer"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-text-secondary" />
        ) : (
          <ChevronRight className="w-3 h-3 text-text-secondary" />
        )}
        <FolderOpen className="w-4 h-4 text-accent-orange" />
        <span className="text-sm flex-1 truncate">{collection.name}</span>
        <span className="text-xs text-text-secondary">
          {collection.items.length}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-card-bg rounded transition-opacity"
        >
          <span className="text-text-secondary hover:text-delete-method">×</span>
        </button>
      </div>
      {isExpanded && collection.items.length > 0 && (
        <div className="ml-4 pl-2 border-l border-elevated-bg">
          {collection.items.map((item) => {
            if (isRequestItem(item)) {
              return (
                <div
                  key={item.id}
                  className="group/request flex items-center gap-2 py-1 px-2 rounded hover:bg-elevated-bg cursor-pointer"
                >
                  <span
                    className={`font-mono text-xs font-semibold ${getMethodColor(item.method)}`}
                  >
                    {item.method}
                  </span>
                  <span
                    className="text-xs truncate flex-1 text-text-secondary"
                    onClick={() => onSelectRequest(item)}
                  >
                    {item.name || formatUrl(item.url)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRequest(item.id, item.name || formatUrl(item.url));
                    }}
                    className="p-1 opacity-0 group-hover/request:opacity-100 hover:bg-card-bg rounded transition-opacity"
                  >
                    <span className="text-text-secondary hover:text-delete-method">×</span>
                  </button>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}

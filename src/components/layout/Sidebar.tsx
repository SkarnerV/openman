import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronDown,
  FolderOpen,
  ChevronRight,
  Globe,
  GripVertical,
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

  const { collections, createCollection, deleteCollection, deleteRequestFromCollection, moveRequest } = useCollectionStore();
  const { setCurrentRequest, setResponse, setError } = useRequestStore();

  // Drag and drop refs (using refs instead of state to avoid re-renders during drag)
  const draggedRequestRef = useRef<{
    request: HttpRequest;
    sourceCollectionId: string;
  } | null>(null);
  const [dragOverCollectionId, setDragOverCollectionId] = useState<string | null>(null);
  const [dragOverRequestIndex, setDragOverRequestIndex] = useState<{ collectionId: string; index: number } | null>(null);

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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, request: HttpRequest, sourceCollectionId: string) => {
    console.log("[DND] Drag started:", { requestId: request.id, requestName: request.name, sourceCollectionId });
    e.dataTransfer.effectAllowed = "move";
    const payload = JSON.stringify({ requestId: request.id, sourceCollectionId });
    // WebKit/WKWebView (Tauri/Safari) requires text/plain for HTML5 drop to fire; see webkit #265857 / tauri #6695
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.setData("application/json", payload);
    // Store in ref instead of state to avoid re-render
    draggedRequestRef.current = { request, sourceCollectionId };
  };

  const handleDragEnd = (_e: React.DragEvent) => {
    console.log("[DND] Drag ended");
    draggedRequestRef.current = null;
    setDragOverCollectionId(null);
    setDragOverRequestIndex(null);
  };

  const handleCollectionDragOver = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedRequestRef.current && draggedRequestRef.current.sourceCollectionId !== collectionId) {
      console.log("[DND] Drag over collection:", collectionId);
      setDragOverCollectionId(collectionId);
    }
  };

  const handleCollectionDrop = async (e: React.DragEvent, targetCollectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[DND] Drop on collection:", targetCollectionId, "draggedRequest:", draggedRequestRef.current);

    if (!draggedRequestRef.current) {
      console.log("[DND] No dragged request, returning");
      return;
    }

    const { request, sourceCollectionId } = draggedRequestRef.current;
    console.log("[DND] Moving request:", { requestId: request.id, sourceCollectionId, targetCollectionId });

    // Only move if different collection
    if (sourceCollectionId !== targetCollectionId) {
      try {
        await moveRequest(sourceCollectionId, request.id, targetCollectionId);
        console.log("[DND] Move successful");
        // Expand the target collection to show the moved request
        setExpandedCollections((prev) => ({ ...prev, [targetCollectionId]: true }));
      } catch (err) {
        console.error("[DND] Failed to move request:", err);
      }
    } else {
      console.log("[DND] Same collection, skipping move");
    }

    draggedRequestRef.current = null;
    setDragOverCollectionId(null);
  };

  const handleRequestDragOver = (e: React.DragEvent, collectionId: string, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (draggedRequestRef.current) {
      console.log("[DND] Drag over request position:", { collectionId, index });
      setDragOverRequestIndex({ collectionId, index });
      setDragOverCollectionId(null);
    }
  };

  const handleRequestDrop = async (e: React.DragEvent, targetCollectionId: string, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[DND] Drop on request position:", { targetCollectionId, targetIndex, draggedRequest: draggedRequestRef.current });

    if (!draggedRequestRef.current) {
      console.log("[DND] No dragged request, returning");
      return;
    }

    const { request, sourceCollectionId } = draggedRequestRef.current;

    try {
      await moveRequest(sourceCollectionId, request.id, targetCollectionId, targetIndex);
      console.log("[DND] Reorder successful");
    } catch (err) {
      console.error("[DND] Failed to move request:", err);
    }

    draggedRequestRef.current = null;
    setDragOverRequestIndex(null);
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
                dragOverCollectionId={dragOverCollectionId}
                dragOverRequestIndex={dragOverRequestIndex}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onCollectionDragOver={handleCollectionDragOver}
                onCollectionDrop={handleCollectionDrop}
                onRequestDragOver={handleRequestDragOver}
                onRequestDrop={handleRequestDrop}
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
  // Drag and drop props
  dragOverCollectionId: string | null;
  dragOverRequestIndex: { collectionId: string; index: number } | null;
  onDragStart: (e: React.DragEvent, request: HttpRequest, sourceCollectionId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onCollectionDragOver: (e: React.DragEvent, collectionId: string) => void;
  onCollectionDrop: (e: React.DragEvent, collectionId: string) => void;
  onRequestDragOver: (e: React.DragEvent, collectionId: string, index: number) => void;
  onRequestDrop: (e: React.DragEvent, collectionId: string, index: number) => void;
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
  dragOverCollectionId,
  dragOverRequestIndex,
  onDragStart,
  onDragEnd,
  onCollectionDragOver,
  onCollectionDrop,
  onRequestDragOver,
  onRequestDrop,
}: CollectionItemProps) {
  const isDragOver = dragOverCollectionId === collection.id;
  const requestItems = collection.items.filter(isRequestItem);

  return (
    <div className="group">
      {/* Collection Header - Drop target for moving between collections */}
      <div
        className={`flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer transition-colors ${
          isDragOver ? "bg-accent-orange/20 border-2 border-accent-orange" : "hover:bg-elevated-bg"
        }`}
        onClick={onToggle}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCollectionDragOver(e, collection.id);
        }}
        onDragOver={(e) => {
          console.log("[DND] Drag over collection header:", collection.id);
          onCollectionDragOver(e, collection.id);
        }}
        onDrop={(e) => {
          console.log("[DND] Drop on collection header:", collection.id);
          onCollectionDrop(e, collection.id);
        }}
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

      {/* Collection Items - With drop zones for reordering */}
      {isExpanded && requestItems.length > 0 && (
        <div className="ml-4 pl-2 border-l border-elevated-bg">
          {/* Drop zone before first item */}
          <DropZone
            isActive={dragOverRequestIndex?.collectionId === collection.id && dragOverRequestIndex?.index === 0}
            onDragOver={(e) => onRequestDragOver(e, collection.id, 0)}
            onDrop={(e) => onRequestDrop(e, collection.id, 0)}
          />

          {requestItems.map((item, index) => {
            return (
              <div key={item.id}>
                {/* Draggable Request Item */}
                <div
                  draggable
                  onDragStart={(e) => onDragStart(e, item, collection.id)}
                  onDragEnd={(e) => onDragEnd(e)}
                  className="group/request flex items-center gap-1 py-1 px-2 rounded cursor-grab active:cursor-grabbing hover:bg-elevated-bg"
                >
                  <GripVertical className="w-3 h-3 text-text-tertiary opacity-0 group-hover/request:opacity-100" />
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

                {/* Drop zone after each item */}
                <DropZone
                  isActive={dragOverRequestIndex?.collectionId === collection.id && dragOverRequestIndex?.index === index + 1}
                  onDragOver={(e) => onRequestDragOver(e, collection.id, index + 1)}
                  onDrop={(e) => onRequestDrop(e, collection.id, index + 1)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Drop zone component for reordering
interface DropZoneProps {
  isActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

function DropZone({ isActive, onDragOver, onDrop }: DropZoneProps) {
  return (
    <div
      className={`relative transition-all ${isActive ? "bg-accent-orange/30 h-8 my-1 rounded" : "h-4 -my-1"}`}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        onDragOver(e);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        onDragOver(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(e);
      }}
    >
      {isActive && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-accent-orange" />
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { X, Save, RefreshCw } from "lucide-react";
import { useCollectionStore } from "../../stores/useCollectionStore";
import { useRequestStore } from "../../stores/useRequestStore";
import { Select } from "./Select";
import type { HttpRequest, HttpResponse } from "../../stores/useRequestStore";

interface SaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: HttpRequest;
}

export function SaveRequestModal({ isOpen, onClose, request }: SaveRequestModalProps) {
  const { collections, createCollection, addRequestToCollection, updateRequestInCollection } = useCollectionStore();
  const { sourceCollectionId, sourceRequestId, response, clearSourceContext } = useRequestStore();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [requestName, setRequestName] = useState(request.name || "");
  const [isNewCollection, setIsNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if this is an update (same collection and request ID)
  const isUpdate = sourceCollectionId && sourceRequestId === request.id;

  useEffect(() => {
    if (isUpdate && sourceCollectionId) {
      // Pre-select the source collection for updates
      setSelectedCollectionId(sourceCollectionId);
    } else if (collections.length > 0 && !selectedCollectionId) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId, isUpdate, sourceCollectionId]);

  useEffect(() => {
    setRequestName(request.name || "");
  }, [request.name]);

  const handleSave = async () => {
    setError(null);

    if (!requestName.trim()) {
      setError("Please enter a request name");
      return;
    }

    setIsSaving(true);
    try {
      let collectionId = selectedCollectionId;

      // Create new collection if needed
      if (isNewCollection) {
        if (!newCollectionName.trim()) {
          setError("Please enter a collection name");
          setIsSaving(false);
          return;
        }
        const newCollection = await createCollection(newCollectionName.trim());
        collectionId = newCollection.id;
      }

      if (!collectionId) {
        setError("Please select or create a collection");
        setIsSaving(false);
        return;
      }

      // Prepare request with response data (Task 1.3)
      const requestToSave: HttpRequest = {
        ...request,
        id: isUpdate ? request.id : crypto.randomUUID(),
        name: requestName.trim(),
        lastResponse: response as HttpResponse | undefined,
        updatedAt: new Date().toISOString(),
      };

      if (isUpdate && sourceCollectionId === collectionId) {
        // Update existing request
        await updateRequestInCollection(collectionId, requestToSave);
      } else {
        // Save as new request
        await addRequestToCollection(collectionId, requestToSave);
        // Clear source context since we're saving as new
        clearSourceContext();
      }
      onClose();
    } catch (err) {
      console.error("Failed to save request:", err);
      const errorMessage = typeof err === 'string'
        ? err
        : err instanceof Error
          ? err.message
          : "Failed to save request";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card-bg border border-elevated-bg rounded-radius p-6 w-[480px] max-w-[90vw] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 min-w-0">
          <h2 className="text-lg font-semibold font-display truncate">
            {isUpdate ? "Update Request" : "Save Request"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-elevated-bg rounded-radius transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-delete-method/10 text-delete-method rounded-radius text-sm">
            {error}
          </div>
        )}

        {/* Request Name */}
        <div className="mb-4">
          <label className="block mb-2 text-sm text-text-secondary">
            Request Name <span className="text-delete-method">*</span>
          </label>
          <input
            type="text"
            value={requestName}
            onChange={(e) => {
              setRequestName(e.target.value);
              setError(null);
            }}
            placeholder="Enter request name"
            className="w-full px-4 py-3 bg-elevated-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>

        {/* Collection Selection */}
        <div className="mb-4">
          <label className="block mb-2 text-sm text-text-secondary">
            Collection
          </label>
          {isNewCollection ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => {
                  setNewCollectionName(e.target.value);
                  setError(null);
                }}
                placeholder="Enter collection name"
                className="flex-1 px-4 py-3 bg-elevated-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <button
                onClick={() => {
                  setIsNewCollection(false);
                  setNewCollectionName("");
                  setError(null);
                }}
                className="px-4 py-3 bg-elevated-bg rounded-radius text-sm hover:bg-card-bg transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select
                value={selectedCollectionId}
                onChange={(value) => {
                  setSelectedCollectionId(value);
                  setError(null);
                }}
                options={collections.map((c: { id: string; name: string }) => ({
                  value: c.id,
                  label: c.name,
                }))}
                placeholder="No collections"
              />
              <button
                onClick={() => setIsNewCollection(true)}
                className="px-4 py-3 bg-accent-orange text-text-on-accent rounded-radius text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                + New
              </button>
            </div>
          )}
        </div>

        {/* Request Preview */}
        <div className="mb-6 p-3 bg-elevated-bg rounded-radius">
          <div className="flex items-center gap-2 mb-2">
            <span className={`font-mono text-sm font-semibold ${
              request.method === "GET" ? "text-get-method" :
              request.method === "POST" ? "text-post-method" :
              request.method === "PUT" ? "text-put-method" :
              request.method === "DELETE" ? "text-delete-method" :
              "text-text-secondary"
            }`}>
              {request.method}
            </span>
            <span className="text-sm text-text-secondary truncate">
              {request.url}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-elevated-bg rounded-radius text-sm hover:bg-card-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-accent-orange text-text-on-accent rounded-radius text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isUpdate ? <RefreshCw className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isSaving
              ? isUpdate ? "Updating..." : "Saving..."
              : isUpdate ? "Update Request" : "Save Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Search, Plus, FolderOpen, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { useCollectionStore } from "../stores/useCollectionStore";
import { useRequestStore } from "../stores/useRequestStore";
import { useNavigate } from "react-router-dom";

export function CollectionsPage() {
  const {
    collections,
    isLoading,
    createCollection,
    deleteCollection,
  } = useCollectionStore();
  const {
    setCurrentRequest,
    setResponse,
    setError,
  } = useRequestStore();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Collections are now loaded in App.tsx

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewCollection = async () => {
    const name = prompt("Enter collection name:");
    if (name?.trim()) {
      try {
        await createCollection(name.trim());
      } catch (err) {
        console.error("Failed to create collection:", err);
        alert("Failed to create collection");
      }
    }
  };

  const handleNewRequest = () => {
    setCurrentRequest(null);
    setResponse(null);
    setError(null);
    navigate("/request");
  };

  const handleDeleteCollection = async (id: string) => {
    if (confirm("Are you sure you want to delete this collection?")) {
      try {
        await deleteCollection(id);
      } catch (err) {
        console.error("Failed to delete collection:", err);
        alert("Failed to delete collection");
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-text-secondary">Loading collections...</p>
      </div>
    );
  }

  // True Empty State
  if (collections.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-card-bg flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-8 h-8 text-text-secondary" />
          </div>
          <h2 className="text-xl font-semibold mb-2 font-display">
            No Collections Yet
          </h2>
          <p className="text-text-secondary mb-6">
            Create your first collection to organize and save your API requests.
          </p>
          <button
            onClick={handleNewCollection}
            className="flex items-center gap-2 px-4 py-2 bg-accent-orange text-text-on-accent rounded-radius font-semibold mx-auto hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Create Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold font-display">Collections</h1>
        <button
          onClick={handleNewRequest}
          className="flex items-center gap-2 px-4 py-2 bg-accent-orange text-text-on-accent rounded-radius font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          New Request
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search collections..."
          className="w-full pl-12 pr-4 py-3 bg-card-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
      </div>

      {/* Collections Grid */}
      {filteredCollections.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          No collections found matching "{searchQuery}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCollections.map((collection) => (
            <div
              key={collection.id}
              className="bg-card-bg rounded-radius p-5 hover:bg-elevated-bg transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-orange/20 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-accent-orange" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{collection.name}</h3>
                    <p className="text-xs text-text-secondary">
                      {collection.items?.length || 0} request
                      {(collection.items?.length || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-card-bg rounded">
                    <MoreVertical className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>
              </div>
              {collection.description && (
                <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                  {collection.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  Updated{" "}
                  {new Date(collection.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1.5 hover:bg-card-bg rounded"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-text-secondary" />
                  </button>
                  <button
                    onClick={() => handleDeleteCollection(collection.id)}
                    className="p-1.5 hover:bg-card-bg rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-delete-method" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

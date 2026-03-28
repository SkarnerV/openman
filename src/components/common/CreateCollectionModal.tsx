import { useState } from "react";
import { X, FolderPlus } from "lucide-react";

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description?: string) => Promise<void>;
}

export function CreateCollectionModal({ isOpen, onClose, onCreate }: CreateCollectionModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Please enter a collection name");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      await onCreate(name.trim(), description.trim() || undefined);
      setName("");
      setDescription("");
      onClose();
    } catch (err) {
      const errorMessage = typeof err === 'string'
        ? err
        : err instanceof Error
          ? err.message
          : String(err);
      setError(errorMessage || "Failed to create collection");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card-bg border border-elevated-bg rounded-radius p-6 w-[480px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FolderPlus className="w-5 h-5 text-accent-orange" />
            <h2 className="text-lg font-semibold font-display">Create Collection</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-elevated-bg rounded-radius transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Name Input */}
        <div className="mb-4">
          <label className="block mb-2 text-sm text-text-secondary">
            Collection Name <span className="text-delete-method">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My API Collection"
            className="w-full px-4 py-3 bg-elevated-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>

        {/* Description Input */}
        <div className="mb-4">
          <label className="block mb-2 text-sm text-text-secondary">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this collection..."
            className="w-full px-4 py-3 bg-elevated-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange resize-none"
            rows={3}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-delete-method/10 text-delete-method rounded-radius text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-elevated-bg rounded-radius text-sm hover:bg-card-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-4 py-2 bg-accent-orange text-text-on-accent rounded-radius text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create Collection"}
          </button>
        </div>
      </div>
    </div>
  );
}
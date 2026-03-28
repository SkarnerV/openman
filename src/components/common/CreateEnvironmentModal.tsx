import { useState } from "react";
import { X, Globe } from "lucide-react";

interface CreateEnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function CreateEnvironmentModal({ isOpen, onClose, onCreate }: CreateEnvironmentModalProps) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Please enter an environment name");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      await onCreate(name.trim());
      setName("");
      onClose();
    } catch (err) {
      // Tauri errors might be strings or have different structure
      const errorMessage = typeof err === 'string'
        ? err
        : err instanceof Error
          ? err.message
          : String(err);
      setError(errorMessage || "Failed to create environment");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card-bg border border-elevated-bg rounded-radius p-6 w-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-accent-orange" />
            <h2 className="text-lg font-semibold font-display">Create Environment</h2>
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
            Environment Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Development, Staging, Production"
            className="w-full px-4 py-3 bg-elevated-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
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
            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
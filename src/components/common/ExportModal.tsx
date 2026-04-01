import { useState } from "react";
import { X, Download, FileJson, Loader2 } from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { exportPostmanCollection } from "../../services/storageService";
import { useWorkspaceStore } from "../../stores/useWorkspaceStore";
import type { Collection } from "../../stores/useCollectionStore";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection | null;
}

export function ExportModal({ isOpen, onClose, collection }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<"postman" | "openman">("postman");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentWorkspace } = useWorkspaceStore();

  const handleExport = async () => {
    if (!collection || !currentWorkspace) {
      setError("No collection selected");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      let content: string;
      let defaultFileName: string;

      if (exportFormat === "postman") {
        content = await exportPostmanCollection(currentWorkspace.id, collection.id);
        defaultFileName = `${collection.name.replace(/\s+/g, "-")}.postman.json`;
      } else {
        // Openman native format - just serialize the collection
        content = JSON.stringify(collection, null, 2);
        defaultFileName = `${collection.name.replace(/\s+/g, "-")}.openman.json`;
      }

      const filePath = await save({
        defaultPath: defaultFileName,
        filters: [
          { name: "JSON", extensions: ["json"] },
        ],
      });

      if (filePath) {
        const encoder = new TextEncoder();
        await writeFile(filePath, encoder.encode(content));
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setExportFormat("postman");
    setError(null);
    onClose();
  };

  if (!isOpen || !collection) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card-bg border border-elevated-bg rounded-radius p-6 w-[480px] max-w-[90vw] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Download className="w-5 h-5 text-accent-orange shrink-0" />
            <h2 className="text-lg font-semibold font-display truncate">Export Collection</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-elevated-bg rounded-radius transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Collection Info */}
        <div className="mb-6 p-3 bg-elevated-bg rounded-radius">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-accent-orange" />
            <span className="text-sm font-medium truncate">{collection.name}</span>
            <span className="text-xs text-text-secondary">
              ({collection.items.length} items)
            </span>
          </div>
          {collection.description && (
            <p className="text-xs text-text-secondary mt-1 truncate">
              {collection.description}
            </p>
          )}
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block mb-2 text-sm text-text-secondary">
            Export Format
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setExportFormat("postman")}
              className={`flex-1 p-3 rounded-radius text-sm transition-colors ${
                exportFormat === "postman"
                  ? "bg-accent-orange text-text-on-accent"
                  : "bg-elevated-bg text-text-secondary hover:bg-card-bg"
              }`}
            >
              <div className="font-medium">Postman v2.1</div>
              <div className="text-xs opacity-75 mt-1">
                Compatible with Postman
              </div>
            </button>
            <button
              onClick={() => setExportFormat("openman")}
              className={`flex-1 p-3 rounded-radius text-sm transition-colors ${
                exportFormat === "openman"
                  ? "bg-accent-orange text-text-on-accent"
                  : "bg-elevated-bg text-text-secondary hover:bg-card-bg"
              }`}
            >
              <div className="font-medium">Openman Native</div>
              <div className="text-xs opacity-75 mt-1">
                Full fidelity backup
              </div>
            </button>
          </div>
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
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-accent-orange text-text-on-accent rounded-radius text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
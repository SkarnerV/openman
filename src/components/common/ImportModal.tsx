import { useState } from "react";
import { X, Upload, FileJson, Link, AlertCircle, Loader2 } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { importPostmanCollection } from "../../services/storageService";
import { useWorkspaceStore } from "../../stores/useWorkspaceStore";
import { useCollectionStore } from "../../stores/useCollectionStore";
import { parseCurlCommand } from "../../utils/curlParser";
import type { HttpRequest } from "../../stores/useRequestStore";

type ImportSource = "file" | "url" | "curl";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [importSource, setImportSource] = useState<ImportSource>("file");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [curlCommand, setCurlCommand] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<"postman" | "openapi" | "unknown" | null>(null);

  const { currentWorkspace } = useWorkspaceStore();
  const { loadCollections } = useCollectionStore();

  const detectFormat = (content: string): "postman" | "openapi" | "unknown" => {
    try {
      const parsed = JSON.parse(content);
      // Postman Collection v2.0/v2.1 detection
      if (parsed.info && parsed.info.schema) {
        if (parsed.info.schema.includes("postman")) {
          return "postman";
        }
      }
      // OpenAPI 3.0 detection
      if (parsed.openapi || parsed.swagger) {
        return "openapi";
      }
      return "unknown";
    } catch {
      return "unknown";
    }
  };

  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "JSON", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (selected) {
        const filePath = selected as string;
        const content = await readFile(filePath);
        const textContent = new TextDecoder().decode(content);
        setFileContent(textContent);
        setFileName(filePath.split("/").pop() || filePath.split("\\").pop() || "unknown");
        setDetectedFormat(detectFormat(textContent));
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    }
  };

  const handleImport = async () => {
    if (!currentWorkspace) {
      setError("No workspace selected");
      return;
    }

    let contentToImport: string | null = null;

    if (importSource === "file") {
      contentToImport = fileContent;
    } else if (importSource === "url") {
      // TODO: Fetch from URL
      setError("Import from URL is not yet implemented");
      return;
    } else if (importSource === "curl") {
      // Parse cURL command
      const parsedRequest = parseCurlCommand(curlCommand);
      if (!parsedRequest) {
        setError("Failed to parse cURL command. Please check the format.");
        return;
      }

      // Create a new collection or add to existing one
      // For now, create a new collection called "Imported from cURL"
      try {
        const { createCollection, addRequestToCollection } = useCollectionStore.getState();
        const collection = await createCollection("Imported from cURL");
        await addRequestToCollection(collection.id, parsedRequest as HttpRequest);
        await loadCollections();
        handleClose();
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to import cURL command");
        return;
      }
    }

    if (!contentToImport) {
      setError("No content to import");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      if (detectedFormat === "postman") {
        await importPostmanCollection(currentWorkspace.id, contentToImport);
        await loadCollections();
        handleClose();
      } else if (detectedFormat === "openapi") {
        setError("OpenAPI import is not yet implemented");
      } else {
        setError("Unknown format. Please provide a Postman Collection or OpenAPI specification.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFileContent(null);
    setFileName(null);
    setUrl("");
    setCurlCommand("");
    setDetectedFormat(null);
    setError(null);
    setImportSource("file");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card-bg border border-elevated-bg rounded-radius p-6 w-[560px] max-w-[90vw] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Upload className="w-5 h-5 text-accent-orange shrink-0" />
            <h2 className="text-lg font-semibold font-display truncate">Import</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-elevated-bg rounded-radius transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Import Source Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "file", label: "File", Icon: FileJson },
            { id: "url", label: "URL", Icon: Link },
            { id: "curl", label: "cURL", Icon: null },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setImportSource(id as ImportSource)}
              className={`flex items-center gap-2 px-4 py-2 rounded-radius text-sm transition-colors ${
                importSource === id
                  ? "bg-accent-orange text-text-on-accent"
                  : "bg-elevated-bg text-text-secondary hover:bg-card-bg"
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </button>
          ))}
        </div>

        {/* File Import */}
        {importSource === "file" && (
          <div className="mb-6">
            <button
              onClick={handleFileSelect}
              className="w-full flex items-center justify-center gap-3 px-4 py-8 border-2 border-dashed border-elevated-bg rounded-radius hover:border-accent-orange transition-colors"
            >
              <FileJson className="w-6 h-6 text-text-secondary" />
              <span className="text-sm text-text-secondary">
                {fileName ? `Selected: ${fileName}` : "Click to select a file"}
              </span>
            </button>

            {detectedFormat && fileContent && (
              <div className="mt-3 p-3 bg-elevated-bg rounded-radius">
                <span className="text-sm text-text-secondary">Detected format: </span>
                <span className={`text-sm font-medium ${
                  detectedFormat === "postman" ? "text-accent-teal" :
                  detectedFormat === "openapi" ? "text-accent-orange" :
                  "text-delete-method"
                }`}>
                  {detectedFormat === "postman" ? "Postman Collection" :
                   detectedFormat === "openapi" ? "OpenAPI/Swagger" :
                   "Unknown"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* URL Import */}
        {importSource === "url" && (
          <div className="mb-6">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to Postman Collection or OpenAPI spec"
              className="w-full px-4 py-3 bg-elevated-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange"
            />
            <p className="mt-2 text-xs text-text-tertiary">
              Supports Postman Collection v2.0/v2.1 and OpenAPI 3.0 specifications
            </p>
          </div>
        )}

        {/* cURL Import */}
        {importSource === "curl" && (
          <div className="mb-6">
            <textarea
              value={curlCommand}
              onChange={(e) => setCurlCommand(e.target.value)}
              placeholder="Paste cURL command here..."
              className="w-full px-4 py-3 bg-elevated-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange font-mono resize-none"
              rows={6}
            />
            <p className="mt-2 text-xs text-text-tertiary">
              Paste a cURL command to import it as a request
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-delete-method/10 text-delete-method rounded-radius text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
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
            onClick={handleImport}
            disabled={isImporting || (!fileContent && !url && !curlCommand)}
            className="px-4 py-2 bg-accent-orange text-text-on-accent rounded-radius text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
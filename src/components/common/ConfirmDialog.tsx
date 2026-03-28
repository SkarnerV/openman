import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card-bg border border-elevated-bg rounded-radius p-6 w-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              variant === "danger" ? "bg-delete-method/20" : "bg-accent-orange/20"
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                variant === "danger" ? "text-delete-method" : "text-accent-orange"
              }`} />
            </div>
            <h2 className="text-lg font-semibold font-display">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-elevated-bg rounded-radius transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Message */}
        <p className="text-text-secondary mb-6">{message}</p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-elevated-bg rounded-radius text-sm hover:bg-card-bg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-radius text-sm font-semibold hover:opacity-90 transition-opacity ${
              variant === "danger"
                ? "bg-delete-method text-white"
                : "bg-accent-orange text-text-on-accent"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
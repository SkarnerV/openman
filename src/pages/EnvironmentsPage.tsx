import { useState } from "react";
import { Plus, Globe, Trash2, Copy } from "lucide-react";
import {
  useEnvironmentStore,
  type Environment,
  type EnvironmentVariable,
} from "../stores/useEnvironmentStore";
import { CreateEnvironmentModal } from "../components/common/CreateEnvironmentModal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { Checkbox } from "../components/common/Checkbox";

export function EnvironmentsPage() {
  const {
    environments,
    activeEnvironment,
    isLoading,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
  } = useEnvironmentStore();

  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(
    environments.find((e) => e.isActive)?.id || environments[0]?.id || null,
  );
  const [newVarKey, setNewVarKey] = useState("");
  const [newVarValue, setNewVarValue] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedEnv = environments.find((e) => e.id === selectedEnvId);

  const handleCreateEnvironment = async (name: string) => {
    const env = await createEnvironment(name);
    setSelectedEnvId(env.id);
  };

  const handleAddVariable = async () => {
    if (!selectedEnvId || !newVarKey.trim()) return;

    const newVar: EnvironmentVariable = {
      key: newVarKey.trim(),
      value: newVarValue,
      enabled: true,
    };

    try {
      const currentVars = selectedEnv?.variables || [];
      await updateEnvironment(selectedEnvId, {
        variables: [...currentVars, newVar],
      });
      setNewVarKey("");
      setNewVarValue("");
      setError(null);
    } catch (err) {
      console.error("Failed to add variable:", err);
      setError("Failed to add variable");
    }
  };

  const handleToggleVariable = async (index: number) => {
    if (!selectedEnv) return;
    const newVars = selectedEnv.variables.map((v, i) =>
      i === index ? { ...v, enabled: !v.enabled } : v,
    );
    await updateEnvironment(selectedEnvId!, { variables: newVars });
  };

  const handleDeleteVariable = async (index: number) => {
    if (!selectedEnv) return;
    const newVars = selectedEnv.variables.filter((_, i) => i !== index);
    await updateEnvironment(selectedEnvId!, { variables: newVars });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEnvironment(deleteTarget.id);
      if (selectedEnvId === deleteTarget.id) {
        setSelectedEnvId(environments[0]?.id || null);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to delete environment:", err);
      setError("Failed to delete environment");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSetActive = async (env: Environment | null) => {
    try {
      await setActiveEnvironment(env);
    } catch (err) {
      console.error("Failed to set active environment:", err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-text-secondary">Loading environments...</p>
      </div>
    );
  }

  // True Empty State
  if (environments.length === 0) {
    return (
      <>
        <CreateEnvironmentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateEnvironment}
        />
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-card-bg flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8 text-text-secondary" />
            </div>
            <h2 className="text-xl font-semibold mb-2 font-display">
              No Environments Yet
            </h2>
            <p className="text-text-secondary mb-6">
              Create an environment to manage variables for different stages
              (development, staging, production).
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-orange text-text-on-accent rounded-radius font-semibold mx-auto hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Create Environment
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CreateEnvironmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateEnvironment}
      />
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Environment"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      {error && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-delete-method/20 text-delete-method rounded-radius">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-text-secondary hover:text-delete-method"
          >
            ×
          </button>
        </div>
      )}
      <div className="h-full flex gap-6 p-8 overflow-hidden">
        {/* Environment List */}
        <div className="w-80 bg-card-bg rounded-radius p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Environments</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-2 hover:bg-elevated-bg rounded-radius transition-colors"
              title="New Environment"
            >
              <Plus className="w-5 h-5 text-accent-orange" />
            </button>
          </div>
          <div className="flex-1 space-y-1 overflow-auto">
            {environments.map((env) => (
              <div
                key={env.id}
                onClick={() => setSelectedEnvId(env.id)}
                className={`group flex items-center justify-between p-3 rounded-radius cursor-pointer transition-colors ${
                  selectedEnvId === env.id
                    ? "bg-elevated-bg"
                    : "hover:bg-elevated-bg/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm">{env.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {activeEnvironment?.id === env.id && (
                    <span className="px-2 py-0.5 text-xs bg-accent-teal/20 text-accent-teal rounded">
                      Active
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ id: env.id, name: env.name });
                    }}
                    className="p-1 hover:bg-card-bg rounded opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4 text-text-secondary hover:text-delete-method" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Variable Editor */}
        <div className="flex-1 bg-card-bg rounded-radius p-5 flex flex-col">
          {selectedEnv ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">{selectedEnv.name}</h2>
                <button
                  onClick={() =>
                    handleSetActive(
                      activeEnvironment?.id === selectedEnv.id
                        ? null
                        : (selectedEnv ?? null),
                    )
                  }
                  className={`px-3 py-1.5 rounded-radius text-sm transition-colors ${
                    activeEnvironment?.id === selectedEnv.id
                      ? "bg-accent-teal text-text-on-accent"
                      : "bg-elevated-bg text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {activeEnvironment?.id === selectedEnv.id
                    ? "Active"
                    : "Set Active"}
                </button>
              </div>

              {/* Add Variable Form */}
              <div className="flex gap-3 mb-4 p-3 bg-elevated-bg rounded-radius">
                <input
                  type="text"
                  value={newVarKey}
                  onChange={(e) => setNewVarKey(e.target.value)}
                  placeholder="Variable name"
                  className="flex-1 px-3 py-2 bg-card-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange"
                  onKeyDown={(e) => e.key === "Enter" && handleAddVariable()}
                />
                <input
                  type="text"
                  value={newVarValue}
                  onChange={(e) => setNewVarValue(e.target.value)}
                  placeholder="Value"
                  className="flex-1 px-3 py-2 bg-card-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange"
                  onKeyDown={(e) => e.key === "Enter" && handleAddVariable()}
                />
                <button
                  onClick={handleAddVariable}
                  disabled={!newVarKey.trim()}
                  className="px-4 py-2 bg-accent-orange text-text-on-accent rounded-radius text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>

              {/* Variables List */}
              <div className="flex-1 overflow-auto">
                {selectedEnv.variables.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    No variables yet. Add your first variable above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedEnv.variables.map((variable, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-radius ${
                          variable.enabled
                            ? "bg-elevated-bg"
                            : "bg-elevated-bg/50"
                        }`}
                      >
                        <Checkbox
                          checked={variable.enabled}
                          onChange={() => handleToggleVariable(index)}
                        />
                        <span className="font-mono text-sm text-accent-orange">
                          {`{{${variable.key}}}`}
                        </span>
                        <span className="flex-1 text-sm text-text-secondary truncate">
                          {variable.value}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`{{${variable.key}}}`);
                          }}
                          className="p-1 hover:bg-card-bg rounded"
                          title="Copy variable"
                        >
                          <Copy className="w-4 h-4 text-text-secondary" />
                        </button>
                        <button
                          onClick={() => handleDeleteVariable(index)}
                          className="p-1 hover:bg-card-bg rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-delete-method" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-secondary">
              Select an environment to view variables
            </div>
          )}
        </div>
      </div>
    </>
  );
}
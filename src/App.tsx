import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ActivityBar, type ActivityTab } from "./components/layout/ActivityBar";
import { Sidebar } from "./components/layout/Sidebar";
import { RequestBuilder } from "./pages/RequestBuilder";
import { CollectionsPage } from "./pages/CollectionsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { EnvironmentsPage } from "./pages/EnvironmentsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useWorkspaceStore } from "./stores/useWorkspaceStore";
import { useCollectionStore } from "./stores/useCollectionStore";
import { useEnvironmentStore } from "./stores/useEnvironmentStore";
import { useThemeStore } from "./stores/useThemeStore";
import { Loader2, AlertCircle } from "lucide-react";

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActivityTab>("collections");
  const { initialize: initWorkspace, initialized, currentWorkspace, error: workspaceError } = useWorkspaceStore();
  const { loadCollections } = useCollectionStore();
  const { loadEnvironments } = useEnvironmentStore();
  const { applyTheme } = useThemeStore();
  const navigate = useNavigate();

  // Initialize workspace and load data on startup
  useEffect(() => {
    initWorkspace();
  }, [initWorkspace]);

  // Apply theme on app load
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Load collections and environments when workspace is ready
  useEffect(() => {
    if (initialized && currentWorkspace) {
      loadCollections();
      loadEnvironments();
    }
  }, [initialized, currentWorkspace, loadCollections, loadEnvironments]);

  const getRouteFromTab = (tab: ActivityTab): string => {
    switch (tab) {
      case "collections":
        return "/collections";
      case "history":
        return "/history";
      case "environments":
        return "/environments";
      case "settings":
        return "/settings";
      default:
        return "/";
    }
  };

  const handleTabChange = (tab: ActivityTab) => {
    setActiveTab(tab);
    navigate(getRouteFromTab(tab));
  };

  // Show loading screen while initializing
  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-page-bg">
        <div className="text-center">
          {workspaceError ? (
            <>
              <AlertCircle className="w-8 h-8 text-delete-method mx-auto mb-4" />
              <p className="text-delete-method mb-2">Failed to initialize</p>
              <p className="text-text-secondary text-sm">{workspaceError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-accent-orange text-text-on-accent rounded-radius"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-accent-orange mx-auto mb-4" />
              <p className="text-text-secondary">Loading OpenMan...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-page-bg text-text-primary overflow-hidden">
      <ActivityBar activeTab={activeTab} onTabChange={handleTabChange} />
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/collections" replace />} />
          <Route path="/request" element={<RequestBuilder />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/environments" element={<EnvironmentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
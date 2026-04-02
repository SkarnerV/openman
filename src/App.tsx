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
import { useSettingsStore } from "./stores/useSettingsStore";
import { useRequestStore } from "./stores/useRequestStore";
import { initBehaviorTracking, cleanupBehaviorTracking, behaviorTracker } from "./services/trackerIntegration";
import { writeLogToFile } from "./services/fileLogger";
import { Loader2, AlertCircle } from "lucide-react";

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActivityTab>("collections");
  const { initialize: initWorkspace, initialized, currentWorkspace, error: workspaceError } = useWorkspaceStore();
  const { loadCollections } = useCollectionStore();
  const { loadEnvironments } = useEnvironmentStore();
  const { applyTheme } = useThemeStore();
  const { toggleSidebar } = useSettingsStore();
  const { setCurrentRequest, setResponse, setError, clearSourceContext } = useRequestStore();
  const navigate = useNavigate();

  // Initialize workspace and load data on startup
  useEffect(() => {
    initWorkspace();
  }, [initWorkspace]);

  // Initialize behavior tracking and add console + file logger
  useEffect(() => {
    // Add console and file logger for user actions
    const removeLogger = behaviorTracker.addListener(async (event) => {
      // Console log
      console.log(`[Openman v0.1.0] User Action: ${event.category}/${event.action}`, {
        label: event.label,
        value: event.value,
        metadata: event.metadata,
        timestamp: new Date(event.timestamp).toISOString(),
      });

      // File log (persists to disk)
      await writeLogToFile({
        version: "0.1.0",
        category: event.category,
        action: event.action,
        label: event.label,
        value: event.value,
        metadata: event.metadata,
      });
    });

    initBehaviorTracking();
    console.log("[Openman v0.1.0] App initialized - behavior tracking enabled, logs saved to file");

    return () => {
      removeLogger();
      cleanupBehaviorTracking();
    };
  }, []);

  // Apply theme on app load
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + N: New request
      if (ctrlOrCmd && key === "n") {
        e.preventDefault();
        setCurrentRequest(null);
        setResponse(null);
        setError(null);
        clearSourceContext();
        navigate("/request");
      }
      // Ctrl/Cmd + B: Toggle sidebar
      else if (ctrlOrCmd && key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      // Ctrl/Cmd + 1-4: Navigate to tabs
      else if (ctrlOrCmd && key === "1") {
        e.preventDefault();
        navigate("/collections");
      }
      else if (ctrlOrCmd && key === "2") {
        e.preventDefault();
        navigate("/request");
      }
      else if (ctrlOrCmd && key === "3") {
        e.preventDefault();
        navigate("/history");
      }
      else if (ctrlOrCmd && key === "4") {
        e.preventDefault();
        navigate("/environments");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, toggleSidebar, setCurrentRequest, setResponse, setError, clearSourceContext]);

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
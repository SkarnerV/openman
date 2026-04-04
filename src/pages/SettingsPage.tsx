import { useState } from "react";
import { Settings, PenTool, Keyboard, Moon, Sun, Monitor, Network } from "lucide-react";
import { useThemeStore } from "../stores/useThemeStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useWorkspaceStore } from "../stores/useWorkspaceStore";
import type { ProxySettings } from "../services/storageService";
import { Select } from "../components/common/Select";
import { Checkbox } from "../components/common/Checkbox";

type SettingsSection = "general" | "editor" | "network" | "shortcuts";

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  const sections: { id: SettingsSection; icon: typeof Settings; label: string }[] = [
    { id: "general", icon: Settings, label: "General" },
    { id: "editor", icon: PenTool, label: "Editor" },
    { id: "network", icon: Network, label: "Network" },
    { id: "shortcuts", icon: Keyboard, label: "Shortcuts" },
  ];

  return (
    <div className="h-full flex gap-6 p-8 overflow-hidden">
      {/* Settings Navigation */}
      <div className="w-60 bg-card-bg rounded-radius p-4">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Settings
        </h2>
        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-radius text-sm transition-colors ${
                  activeSection === section.id
                    ? "bg-elevated-bg text-text-primary"
                    : "text-text-secondary hover:bg-elevated-bg/50 hover:text-text-primary"
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 bg-card-bg rounded-radius p-6 overflow-auto">
        {activeSection === "general" && <GeneralSettings />}
        {activeSection === "editor" && <EditorSettings />}
        {activeSection === "network" && <NetworkSettings />}
        {activeSection === "shortcuts" && <ShortcutsSettings />}
      </div>
    </div>
  );
}

function GeneralSettings() {
  const { theme, setTheme } = useThemeStore();
  const { language, autoSave, sendAnalytics, setLanguage, setAutoSave, setSendAnalytics } = useSettingsStore();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 font-display">General Settings</h2>
      <div className="space-y-6">
        {/* Theme Selection */}
        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Theme</h3>
            <p className="text-sm text-text-secondary">
              Choose your preferred color theme
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-2 px-4 py-2 rounded-radius transition-colors ${
                theme === "light"
                  ? "bg-accent-orange text-text-on-accent"
                  : "bg-elevated-bg text-text-secondary hover:text-text-primary"
              }`}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-2 px-4 py-2 rounded-radius transition-colors ${
                theme === "dark"
                  ? "bg-accent-orange text-text-on-accent"
                  : "bg-elevated-bg text-text-secondary hover:text-text-primary"
              }`}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex items-center gap-2 px-4 py-2 rounded-radius transition-colors ${
                theme === "system"
                  ? "bg-accent-orange text-text-on-accent"
                  : "bg-elevated-bg text-text-secondary hover:text-text-primary"
              }`}
            >
              <Monitor className="w-4 h-4" />
              System
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Language</h3>
            <p className="text-sm text-text-secondary">
              Select your preferred language
            </p>
          </div>
          <Select
            value={language}
            onChange={(value) => setLanguage(value)}
            options={[
              { value: "en", label: "English" },
              { value: "zh", label: "中文" },
              { value: "ja", label: "日本語" },
            ]}
          />
        </div>

        {/* Auto Save */}
        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Auto Save</h3>
            <p className="text-sm text-text-secondary">
              Automatically save requests and collections
            </p>
          </div>
          <Checkbox
            checked={autoSave}
            onChange={(checked) => setAutoSave(checked)}
          />
        </div>

        {/* Send Analytics */}
        <div className="flex items-center justify-between py-3">
          <div>
            <h3 className="font-medium">Send Anonymous Analytics</h3>
            <p className="text-sm text-text-secondary">
              Help improve Openman by sending anonymous usage data
            </p>
          </div>
          <Checkbox
            checked={sendAnalytics}
            onChange={(checked) => setSendAnalytics(checked)}
          />
        </div>

        {/* Version Info */}
        <div className="flex items-center justify-between py-3 border-t border-elevated-bg mt-6">
          <div>
            <h3 className="font-medium">Version</h3>
            <p className="text-sm text-text-secondary">
              Openman v0.1.0 - API Testing Tool
            </p>
          </div>
          <span className="px-3 py-1 bg-accent-orange/10 text-accent-orange rounded-radius text-sm font-medium">
            v0.1.0
          </span>
        </div>
      </div>
    </div>
  );
}

function EditorSettings() {
  const { fontSize, tabSize, wordWrap, autoFormatJson, setFontSize, setTabSize, setWordWrap, setAutoFormatJson } = useSettingsStore();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 font-display">Editor Settings</h2>
      <div className="space-y-6">
        {/* Font Size */}
        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Font Size</h3>
            <p className="text-sm text-text-secondary">
              Adjust the editor font size
            </p>
          </div>
          <Select
            value={fontSize.toString()}
            onChange={(value) => setFontSize(Number(value))}
            options={[
              { value: "12", label: "12px" },
              { value: "14", label: "14px" },
              { value: "16", label: "16px" },
              { value: "18", label: "18px" },
            ]}
          />
        </div>

        {/* Tab Size */}
        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Tab Size</h3>
            <p className="text-sm text-text-secondary">
              Number of spaces for tab indentation
            </p>
          </div>
          <Select
            value={tabSize.toString()}
            onChange={(value) => setTabSize(Number(value))}
            options={[
              { value: "2", label: "2 spaces" },
              { value: "4", label: "4 spaces" },
            ]}
          />
        </div>

        {/* Word Wrap */}
        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Word Wrap</h3>
            <p className="text-sm text-text-secondary">
              Wrap long lines in the editor
            </p>
          </div>
          <Checkbox
            checked={wordWrap}
            onChange={(checked) => setWordWrap(checked)}
          />
        </div>

        {/* Auto Format */}
        <div className="flex items-center justify-between py-3">
          <div>
            <h3 className="font-medium">Auto Format JSON</h3>
            <p className="text-sm text-text-secondary">
              Automatically format JSON responses
            </p>
          </div>
          <Checkbox
            checked={autoFormatJson}
            onChange={(checked) => setAutoFormatJson(checked)}
          />
        </div>
      </div>
    </div>
  );
}

function NetworkSettings() {
  const { currentWorkspace, updateSettings } = useWorkspaceStore();

  const proxy: ProxySettings = currentWorkspace?.settings.proxy ?? {
    enabled: false,
    host: "",
    port: 8080,
    username: "",
    password: "",
    noProxy: "",
  };

  const updateProxy = (updates: Partial<ProxySettings>) => {
    if (!currentWorkspace) return;

    const nextProxy: ProxySettings = {
      ...proxy,
      ...updates,
    };

    void updateSettings({
      ...currentWorkspace.settings,
      proxy: nextProxy,
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 font-display">Network Settings</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Enable Proxy</h3>
            <p className="text-sm text-text-secondary">
              Route HTTP requests through a proxy server
            </p>
          </div>
          <Checkbox
            checked={proxy.enabled}
            onChange={(checked) => updateProxy({ enabled: checked })}
          />
        </div>

        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Proxy Host</h3>
            <p className="text-sm text-text-secondary">
              Hostname or IP address of your proxy server
            </p>
          </div>
          <input
            type="text"
            value={proxy.host}
            onChange={(e) => updateProxy({ host: e.target.value })}
            placeholder="proxy.company.com"
            disabled={!proxy.enabled}
            className="w-72 px-4 py-2 bg-elevated-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange disabled:opacity-50"
          />
        </div>

        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Proxy Port</h3>
            <p className="text-sm text-text-secondary">
              Port used by the proxy server
            </p>
          </div>
          <input
            type="number"
            value={proxy.port}
            onChange={(e) => {
              const parsedPort = Number(e.target.value);
              updateProxy({ port: Number.isNaN(parsedPort) ? 0 : parsedPort });
            }}
            min={1}
            max={65535}
            disabled={!proxy.enabled}
            className="w-72 px-4 py-2 bg-elevated-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange disabled:opacity-50"
          />
        </div>

        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Username</h3>
            <p className="text-sm text-text-secondary">
              Optional username for authenticated proxies
            </p>
          </div>
          <input
            type="text"
            value={proxy.username ?? ""}
            onChange={(e) => updateProxy({ username: e.target.value })}
            placeholder="username"
            disabled={!proxy.enabled}
            className="w-72 px-4 py-2 bg-elevated-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange disabled:opacity-50"
          />
        </div>

        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Password</h3>
            <p className="text-sm text-text-secondary">
              Optional password for authenticated proxies
            </p>
          </div>
          <input
            type="password"
            value={proxy.password ?? ""}
            onChange={(e) => updateProxy({ password: e.target.value })}
            placeholder="password"
            disabled={!proxy.enabled}
            className="w-72 px-4 py-2 bg-elevated-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange disabled:opacity-50"
          />
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <h3 className="font-medium">Bypass List (no_proxy)</h3>
            <p className="text-sm text-text-secondary">
              Comma-separated hosts that should bypass the proxy
            </p>
          </div>
          <input
            type="text"
            value={proxy.noProxy ?? ""}
            onChange={(e) => updateProxy({ noProxy: e.target.value })}
            placeholder="localhost,127.0.0.1,.internal.company.com"
            disabled={!proxy.enabled}
            className="w-72 px-4 py-2 bg-elevated-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}

function ShortcutsSettings() {
  const shortcuts = [
    { action: "Send Request", shortcut: "Ctrl + Enter" },
    { action: "Save Request", shortcut: "Ctrl + S" },
    { action: "New Request", shortcut: "Ctrl + N" },
    { action: "Close Tab", shortcut: "Ctrl + W" },
    { action: "Toggle Sidebar", shortcut: "Ctrl + B" },
    { action: "Open Settings", shortcut: "Ctrl + ," },
    { action: "Search", shortcut: "Ctrl + K" },
    { action: "Format JSON", shortcut: "Ctrl + Shift + F" },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 font-display">Keyboard Shortcuts</h2>
      <div className="space-y-1">
        {shortcuts.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-3 px-4 rounded-radius hover:bg-elevated-bg"
          >
            <span className="text-sm">{item.action}</span>
            <kbd className="px-3 py-1.5 bg-elevated-bg rounded text-sm font-mono text-text-secondary">
              {item.shortcut}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}

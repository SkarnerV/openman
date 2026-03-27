import { useState } from "react";
import { Settings, PenTool, Keyboard, Moon, Sun, Monitor } from "lucide-react";

type SettingsSection = "general" | "editor" | "shortcuts";

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  const sections: { id: SettingsSection; icon: typeof Settings; label: string }[] = [
    { id: "general", icon: Settings, label: "General" },
    { id: "editor", icon: PenTool, label: "Editor" },
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
        {activeSection === "shortcuts" && <ShortcutsSettings />}
      </div>
    </div>
  );
}

function GeneralSettings() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");

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
          <select className="px-4 py-2 bg-elevated-bg rounded-radius text-sm">
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        {/* Auto Save */}
        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Auto Save</h3>
            <p className="text-sm text-text-secondary">
              Automatically save requests and collections
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-elevated-bg peer-focus:outline-none rounded-radius peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-orange"></div>
          </label>
        </div>

        {/* Send Analytics */}
        <div className="flex items-center justify-between py-3">
          <div>
            <h3 className="font-medium">Send Anonymous Analytics</h3>
            <p className="text-sm text-text-secondary">
              Help improve Openman by sending anonymous usage data
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-elevated-bg peer-focus:outline-none rounded-radius peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-orange"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

function EditorSettings() {
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
          <select className="px-4 py-2 bg-elevated-bg rounded-radius text-sm">
            <option value="12">12px</option>
            <option value="14" selected>14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
          </select>
        </div>

        {/* Tab Size */}
        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Tab Size</h3>
            <p className="text-sm text-text-secondary">
              Number of spaces for tab indentation
            </p>
          </div>
          <select className="px-4 py-2 bg-elevated-bg rounded-radius text-sm">
            <option value="2">2 spaces</option>
            <option value="4" selected>4 spaces</option>
          </select>
        </div>

        {/* Word Wrap */}
        <div className="flex items-center justify-between py-3 border-b border-elevated-bg">
          <div>
            <h3 className="font-medium">Word Wrap</h3>
            <p className="text-sm text-text-secondary">
              Wrap long lines in the editor
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-elevated-bg peer-focus:outline-none rounded-radius peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-orange"></div>
          </label>
        </div>

        {/* Auto Format */}
        <div className="flex items-center justify-between py-3">
          <div>
            <h3 className="font-medium">Auto Format JSON</h3>
            <p className="text-sm text-text-secondary">
              Automatically format JSON responses
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-elevated-bg peer-focus:outline-none rounded-radius peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-orange"></div>
          </label>
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
import { Folder, Globe, Settings, History, PanelLeft, PanelLeftClose } from "lucide-react";
import { useSettingsStore } from "../../stores/useSettingsStore";

export type ActivityTab = "collections" | "history" | "environments" | "settings";

interface ActivityBarProps {
  activeTab: ActivityTab;
  onTabChange: (tab: ActivityTab) => void;
}

export function ActivityBar({ activeTab, onTabChange }: ActivityBarProps) {
  const { sidebarVisible, toggleSidebar } = useSettingsStore();

  const tabs: { id: ActivityTab; icon: typeof Folder; label: string }[] = [
    { id: "collections", icon: Folder, label: "Collections" },
    { id: "history", icon: History, label: "History" },
    { id: "environments", icon: Globe, label: "Environments" },
  ];

  const bottomTabs: { id: ActivityTab; icon: typeof Folder; label: string }[] = [
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const renderTab = (tab: (typeof tabs)[0]) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    return (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          transition-colors duration-150
          ${
            isActive
              ? "bg-elevated-bg text-accent-orange"
              : "text-text-secondary hover:bg-elevated-bg hover:text-text-primary"
          }
        `}
        title={tab.label}
      >
        <Icon className="w-5 h-5" />
      </button>
    );
  };

  return (
    <div className="w-12 h-full bg-page-bg flex flex-col items-center py-3 gap-1">
      {/* Sidebar Toggle - at the top */}
      <button
        onClick={toggleSidebar}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-text-secondary hover:bg-elevated-bg hover:text-text-primary transition-colors duration-150 mb-2"
        title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
      >
        {sidebarVisible ? (
          <PanelLeftClose className="w-5 h-5" />
        ) : (
          <PanelLeft className="w-5 h-5" />
        )}
      </button>

      {/* Divider */}
      <div className="w-6 h-px bg-elevated-bg mb-2" />

      {/* Top tabs */}
      {tabs.map(renderTab)}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom tabs */}
      {bottomTabs.map(renderTab)}
    </div>
  );
}
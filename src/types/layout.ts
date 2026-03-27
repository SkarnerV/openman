import type { ActivityTab } from "../components/layout/ActivityBar";

export interface ActivityBarProps {
  activeTab: ActivityTab;
  onTabChange: (tab: ActivityTab) => void;
}

export interface SidebarProps {
  activeTab: ActivityTab;
  onTabChange: (tab: ActivityTab) => void;
}

export type ViewMode = "request" | "collections" | "history" | "environments" | "settings";
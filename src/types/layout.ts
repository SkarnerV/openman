export interface MainContentProps {
  activeTab: "http" | "grpc" | "mcp";
}

export interface SidebarProps {
  activeTab: "http" | "grpc" | "mcp";
  onTabChange: (tab: "http" | "grpc" | "mcp") => void;
}

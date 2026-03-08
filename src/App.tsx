import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { MainContent } from "./components/layout/MainContent";

function App() {
  const [activeTab, setActiveTab] = useState<"http" | "grpc" | "mcp">("http");

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <MainContent activeTab={activeTab} />
    </div>
  );
}

export default App;

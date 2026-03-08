import { MainContentProps } from "@/types/layout";
import { HttpPanel } from "../http/HttpPanel";
import { GrpcPanel } from "../grpc/GrpcPanel";
import { McpPanel } from "../mcp/McpPanel";

export function MainContent({ activeTab }: MainContentProps) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {activeTab === "http" && <HttpPanel />}
      {activeTab === "grpc" && <GrpcPanel />}
      {activeTab === "mcp" && <McpPanel />}
    </div>
  );
}

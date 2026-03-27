import { Outlet } from "react-router-dom";

export function MainContent() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Outlet />
    </div>
  );
}
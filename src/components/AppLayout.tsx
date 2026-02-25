import { Sidebar } from "./Sidebar";
import { MessagePanel } from "./MessagePanel";

export function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Title bar drag region */}
      <div className="app-draggable fixed top-0 left-0 right-0 h-8 z-50" />

      {/* Sidebar */}
      <div className="w-[340px] min-w-[280px] border-r border-border flex flex-col bg-background pt-8">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col pt-8 min-w-0">
        <MessagePanel />
      </div>
    </div>
  );
}

import { ProjectSelector } from "./ProjectSelector";
import { ConversationList } from "./ConversationList";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useAppState } from "@/contexts/AppStateContext";

export function Sidebar() {
  const { searchQuery, setSearchQuery } = useAppState();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* App title + project selector */}
      <div className="px-3 pt-3 pb-1 shrink-0 space-y-1">
        <h1 className="text-sm font-semibold text-foreground px-1">
          Claude Conversations
        </h1>
        <ProjectSelector />
      </div>

      <Separator className="my-1" />

      {/* Search */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ConversationList />
      </div>
    </div>
  );
}

import { useConversations } from "@/hooks/useConversations";
import { useAppState } from "@/contexts/AppStateContext";
import { ConversationItem } from "./ConversationItem";
import { Skeleton } from "@/components/ui/skeleton";

export function ConversationList() {
  const { selectedProject, searchQuery, selectedConversation, setSelectedConversation } =
    useAppState();
  const { conversations, loading } = useConversations(selectedProject);

  const filtered = searchQuery
    ? conversations.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
          c.firstPrompt.toLowerCase().includes(q) ||
          (c.summary && c.summary.toLowerCase().includes(q))
        );
      })
    : conversations;

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        No conversations found
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-1 p-2">
        {filtered.map((convo) => (
          <ConversationItem
            key={convo.sessionId}
            conversation={convo}
            isSelected={selectedConversation?.sessionId === convo.sessionId}
            onClick={() => setSelectedConversation(convo)}
          />
        ))}
      </div>
    </div>
  );
}

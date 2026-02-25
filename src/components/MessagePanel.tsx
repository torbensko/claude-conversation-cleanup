import { useAppState } from "@/contexts/AppStateContext";
import { useMessages } from "@/hooks/useMessages";
import { MessageBubble } from "./MessageBubble";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function MessagePanel() {
  const { selectedConversation } = useAppState();
  const { messages, loading, reload } = useMessages(
    selectedConversation?.fullPath ?? null
  );
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a conversation to view messages</p>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!deleteTarget || !selectedConversation) return;

    const result = await window.api.deleteMessagesFrom(
      selectedConversation.fullPath,
      deleteTarget
    );

    if (result.success) {
      toast.success(
        `Rewound conversation: ${result.deletedCount} message(s) removed`,
        { description: `Backup saved` }
      );
      reload();
    } else {
      toast.error("Failed to delete messages");
    }

    setDeleteTarget(null);
  };

  const title = selectedConversation.summary || selectedConversation.firstPrompt;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold line-clamp-1 mb-1">{title}</h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{selectedConversation.projectName}</span>
          {selectedConversation.gitBranch && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1 py-0 gap-0.5"
            >
              <GitBranch className="h-2.5 w-2.5" />
              {selectedConversation.gitBranch}
            </Badge>
          )}
          <span>{messages.length} messages</span>
        </div>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-3/4" />
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-3 pb-8">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.uuid}
                message={msg}
                onDelete={() => setDeleteTarget(msg.uuid)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}

import { useConversations } from "@/hooks/useConversations";
import { useAppState } from "@/contexts/AppStateContext";
import { ConversationItem } from "./ConversationItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function ConversationList() {
  const { selectedProject, searchQuery, selectedConversation, setSelectedConversation } =
    useAppState();
  const { conversations, loading, updateSummary } = useConversations(selectedProject);
  const [missingCount, setMissingCount] = useState(0);
  const [repairing, setRepairing] = useState(false);

  useEffect(() => {
    window.api.checkIndexHealth().then((r) => setMissingCount(r.missingCount));
  }, []);

  const handleRepair = async () => {
    setRepairing(true);
    try {
      const result = await window.api.repairIndexes();
      if (result.addedEntries > 0) {
        toast.success(`Repaired ${result.repairedProjects} project(s)`, {
          description: `Fixed ${result.addedEntries} conversation(s) in VS Code index`,
        });
      }
      setMissingCount(0);
    } catch {
      toast.error("Failed to repair indexes");
    } finally {
      setRepairing(false);
    }
  };

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
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="space-y-1 p-2">
          {filtered.map((convo) => (
            <ConversationItem
              key={convo.sessionId}
              conversation={convo}
              isSelected={selectedConversation?.sessionId === convo.sessionId}
              onClick={() => setSelectedConversation(convo)}
              onSummaryGenerated={updateSummary}
            />
          ))}
        </div>
      </div>
      {missingCount > 0 && (
        <div className="shrink-0 border-t border-border px-3 py-2 bg-muted/50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {missingCount} conversation{missingCount !== 1 ? "s" : ""} need{missingCount === 1 ? "s" : ""} repair in VS Code index
              </p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={handleRepair}
                disabled={repairing}
              >
                {repairing ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Repairing...
                  </>
                ) : (
                  "Repair now"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

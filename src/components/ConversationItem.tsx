import type { ConversationEntry } from "@/types/conversations";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MessageSquare, GitBranch } from "lucide-react";

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface ConversationItemProps {
  conversation: ConversationEntry;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const title = conversation.summary || conversation.firstPrompt;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50 text-foreground"
      )}
    >
      {/* Title - wraps up to 3 lines */}
      <p className="text-sm font-medium line-clamp-3">{title}</p>

      {/* Project short name */}
      <p className="text-xs text-muted-foreground truncate mt-0.5 mb-1.5">
        {conversation.projectName}
      </p>

      {/* Metadata row */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
        <span className="shrink-0">
          {formatRelativeDate(conversation.modified)}
        </span>
        {conversation.gitBranch && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1 py-0 gap-0.5 shrink-0"
          >
            <GitBranch className="h-2.5 w-2.5" />
            {conversation.gitBranch}
          </Badge>
        )}
        <div className="flex items-center gap-0.5 ml-auto shrink-0">
          <MessageSquare className="h-3 w-3" />
          <span>{conversation.messageCount}</span>
        </div>
      </div>
    </button>
  );
}

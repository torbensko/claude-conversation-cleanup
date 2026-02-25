import type { Message } from "@/types/conversations";
import { MessageContent } from "./MessageContent";
import { cn } from "@/lib/utils";
import { Trash2, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: Message;
  onDelete: () => void;
}

function formatTime(timestamp: string): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
  const isUser = message.type === "user";

  return (
    <div
      className={cn(
        "group relative flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "relative rounded-lg px-4 py-2.5 max-w-[85%] min-w-[100px]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border"
        )}
      >
        {/* Model label for assistant */}
        {!isUser && message.message.model && (
          <div className="text-[10px] text-muted-foreground mb-1">
            {message.message.model}
          </div>
        )}

        <MessageContent
          content={message.message.content}
          isUser={isUser}
        />

        {/* Timestamp */}
        <div
          className={cn(
            "text-[10px] mt-1.5",
            isUser ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          {formatTime(message.timestamp)}
        </div>

        {/* Delete button (on hover) */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-white hover:bg-destructive/90 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

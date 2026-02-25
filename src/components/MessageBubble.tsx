import type { Message, ContentBlock } from "@/types/conversations";
import { MessageContent } from "./MessageContent";
import { cn } from "@/lib/utils";
import { Trash2, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Wrench, Terminal } from "lucide-react";

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

function getTextBlocks(content: string | ContentBlock[]): ContentBlock[] {
  if (typeof content === "string") return [{ type: "text", text: content }];
  return content.filter((b) => b.type === "text" || b.type === "thinking");
}

function getToolBlocks(content: string | ContentBlock[]): ContentBlock[] {
  if (typeof content === "string") return [];
  return content.filter((b) => b.type === "tool_use" || b.type === "tool_result");
}

function getToolBrief(block: ContentBlock): string {
  if (block.type === "tool_use") {
    const input = block.input;
    if (!input) return "";
    if ("command" in input && typeof input.command === "string") return input.command.slice(0, 120);
    if ("file_path" in input && typeof input.file_path === "string") return input.file_path;
    if ("pattern" in input && typeof input.pattern === "string") return input.pattern;
    if ("query" in input && typeof input.query === "string") return input.query.slice(0, 120);
    if ("description" in input && typeof input.description === "string") return input.description.slice(0, 120);
    if ("prompt" in input && typeof input.prompt === "string") return input.prompt.slice(0, 120);
  }
  if (block.type === "tool_result") {
    let text = "";
    if (typeof block.content === "string") {
      text = block.content;
    } else if (Array.isArray(block.content)) {
      const first = (block.content as Array<{ type?: string; text?: string }>).find((c) => c.type === "text");
      text = first?.text || "";
    }
    return text.slice(0, 100);
  }
  return "";
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
  const isUser = message.type === "user";
  const textBlocks = getTextBlocks(message.message.content);
  const toolBlocks = getToolBlocks(message.message.content);
  const hasText = textBlocks.some((b) => (b.type === "text" && b.text?.trim()) || b.type === "thinking");

  return (
    <div className="group relative">
      {/* Text bubble row */}
      {hasText && (
        <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
          {/* Avatar */}
          {isUser ? (
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 bg-primary text-primary-foreground">
              <User className="h-3.5 w-3.5" />
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 bg-secondary text-secondary-foreground cursor-default">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              </TooltipTrigger>
              {message.message.model && (
                <TooltipContent side="right">
                  <p className="text-xs">{message.message.model}</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Bubble */}
          <div
            className={cn(
              "relative rounded-lg px-4 py-2.5 max-w-[85%] min-w-[100px]",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border"
            )}
          >
            <MessageContent content={textBlocks} isUser={isUser} />

            {/* Delete button */}
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
      )}

      {/* Tool blocks - shown as compact standalone items */}
      {toolBlocks.length > 0 && (
        <div className={cn("space-y-1", hasText ? "mt-1.5 ml-10" : "ml-10")}>
          {toolBlocks.map((block, i) => (
            <ToolItem key={i} block={block} />
          ))}
        </div>
      )}

      {/* Timestamp below */}
      <div className={cn("text-[10px] text-muted-foreground mt-1", hasText ? (isUser ? "text-right mr-10" : "ml-10") : "ml-10")}>
        {formatTime(message.timestamp)}
      </div>

      {/* Delete button for tool-only messages (no text bubble) */}
      {!hasText && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-white hover:bg-destructive/90 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

function ToolItem({ block }: { block: ContentBlock }) {
  const brief = getToolBrief(block);
  const isToolUse = block.type === "tool_use";
  const isError = block.type === "tool_result" && block.is_error;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-0.5">
      {isToolUse ? (
        <Wrench className="h-3 w-3 shrink-0" />
      ) : (
        <Terminal className="h-3 w-3 shrink-0" />
      )}
      {isToolUse && block.name && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
          {block.name}
        </Badge>
      )}
      {brief && (
        <span className={cn("truncate", isError && "text-destructive")}>
          {brief}
        </span>
      )}
    </div>
  );
}

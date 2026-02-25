import type { Message, ContentBlock } from "@/types/conversations";
import { MessageContent } from "./MessageContent";
import { cn } from "@/lib/utils";
import { Trash2, User, Bot, Pencil, Terminal, Search, Eye, Globe, FileText, Wrench, Brain, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

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
  return content.filter((b) => b.type === "text");
}

function getActionBlocks(content: string | ContentBlock[]): ContentBlock[] {
  if (typeof content === "string") return [];
  return content.filter((b) => b.type === "tool_use" || b.type === "tool_result" || b.type === "thinking");
}

function getToolInput(block: ContentBlock): string {
  if (block.type !== "tool_use") return "";
  const input = block.input;
  if (!input) return "";
  if ("command" in input && typeof input.command === "string") return input.command;
  if ("file_path" in input && typeof input.file_path === "string") return input.file_path;
  if ("pattern" in input && typeof input.pattern === "string") return input.pattern;
  if ("query" in input && typeof input.query === "string") return input.query;
  if ("description" in input && typeof input.description === "string") return input.description;
  if ("prompt" in input && typeof input.prompt === "string") return input.prompt;
  if ("old_string" in input && typeof input.old_string === "string") return input.old_string;
  return "";
}

function getToolResultText(block: ContentBlock): string {
  if (block.type !== "tool_result") return "";
  if (typeof block.content === "string") return block.content;
  if (Array.isArray(block.content)) {
    const first = (block.content as Array<{ type?: string; text?: string }>).find((c) => c.type === "text");
    return first?.text || "";
  }
  return "";
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
  const isUser = message.type === "user";
  const textBlocks = getTextBlocks(message.message.content);
  const actionBlocks = getActionBlocks(message.message.content);
  const hasText = textBlocks.some((b) => b.type === "text" && b.text?.trim());

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

      {/* Action blocks — tools + thinking */}
      {actionBlocks.length > 0 && (
        <div className={cn("space-y-1", hasText ? "mt-1.5 ml-10" : "ml-10")}>
          {actionBlocks.map((block, i) => (
            <ActionItem key={i} block={block} />
          ))}
        </div>
      )}

      {/* Timestamp below — only on text messages */}
      {hasText && (
        <div className={cn("text-[10px] text-muted-foreground mt-1", isUser ? "text-right mr-10" : "ml-10")}>
          {formatTime(message.timestamp)}
        </div>
      )}

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

function getToolIcon(block: ContentBlock) {
  const name = block.type === "tool_use" ? block.name : undefined;
  const iconClass = "h-3.5 w-3.5 shrink-0 mt-0.5";

  switch (name) {
    case "Bash":
      return <Terminal className={iconClass} />;
    case "Edit":
    case "Write":
    case "NotebookEdit":
      return <Pencil className={iconClass} />;
    case "Read":
      return <Eye className={iconClass} />;
    case "Grep":
    case "Glob":
      return <Search className={iconClass} />;
    case "WebFetch":
    case "WebSearch":
      return <Globe className={iconClass} />;
    case "Task":
      return <FileText className={iconClass} />;
    default:
      // tool_result or unknown tool_use
      return block.type === "tool_result"
        ? <Terminal className={iconClass} />
        : <Wrench className={iconClass} />;
  }
}

function ActionItem({ block }: { block: ContentBlock }) {
  if (block.type === "thinking") {
    return <ThinkingItem content={block.thinking || ""} />;
  }

  const isToolUse = block.type === "tool_use";
  const isError = block.type === "tool_result" && block.is_error;
  const content = isToolUse ? getToolInput(block) : getToolResultText(block);

  if (!content) return null;

  return (
    <div className="flex gap-2 text-xs text-muted-foreground py-0.5">
      {getToolIcon(block)}
      <pre className={cn(
        "flex-1 bg-muted/50 rounded p-2 overflow-x-auto text-[11px] whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto",
        isError && "text-destructive"
      )}>
        <code>{content}</code>
      </pre>
    </div>
  );
}

function ThinkingItem({ content }: { content: string }) {
  const [open, setOpen] = useState(false);

  if (!content) return null;

  return (
    <div className="flex gap-2 text-xs text-muted-foreground py-0.5">
      <Brain className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronRight className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
          <span>Thinking</span>
        </button>
        {open && (
          <pre className="mt-1 bg-muted/50 rounded p-2 text-[11px] whitespace-pre-wrap break-all max-h-[300px] overflow-y-auto italic">
            <code>{content}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

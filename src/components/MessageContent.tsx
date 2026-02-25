import type { ContentBlock } from "@/types/conversations";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Brain, Wrench, Terminal } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";

interface MessageContentProps {
  content: string | ContentBlock[];
  isUser: boolean;
}

function MarkdownText({ text, isUser }: { text: string; isUser: boolean }) {
  return (
    <div className={cn("text-sm prose-sm break-words", isUser ? "prose-invert" : "prose-neutral dark:prose-invert")}>
      <Markdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <pre className="bg-muted/50 rounded p-2 overflow-x-auto my-2">
                  <code className="text-[12px]">{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-muted/50 rounded px-1 py-0.5 text-[12px]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          h1: ({ children }) => <h1 className="text-base font-bold mb-1 mt-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold mb-1 mt-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="text-xs border-collapse w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-2 py-1 text-left font-semibold bg-muted/50">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-2 py-1">{children}</td>
          ),
          hr: () => <hr className="border-border my-3" />,
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}

export function MessageContent({ content, isUser }: MessageContentProps) {
  if (typeof content === "string") {
    return <MarkdownText text={content} isUser={isUser} />;
  }

  return (
    <div className="space-y-2">
      {content.map((block, i) => (
        <ContentBlockView key={i} block={block} isUser={isUser} />
      ))}
    </div>
  );
}

function ContentBlockView({
  block,
  isUser,
}: {
  block: ContentBlock;
  isUser: boolean;
}) {
  switch (block.type) {
    case "text":
      return <MarkdownText text={block.text || ""} isUser={isUser} />;

    case "thinking":
      return <ThinkingBlock content={block.thinking || ""} />;

    case "tool_use":
      return (
        <ToolUseBlock
          name={block.name || "unknown"}
          input={block.input}
        />
      );

    case "tool_result":
      return <ToolResultBlock content={block.content} isError={block.is_error} isUser={isUser} />;

    default:
      return null;
  }
}

function ThinkingBlock({ content }: { content: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ChevronRight
          className={cn(
            "h-3 w-3 transition-transform",
            open && "rotate-90"
          )}
        />
        <Brain className="h-3 w-3" />
        <span>Thinking</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1.5 pl-5 text-xs text-muted-foreground italic whitespace-pre-wrap max-h-[300px] overflow-y-auto">
          {content}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ToolUseBlock({
  name,
  input,
}: {
  name: string;
  input?: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);

  let brief = "";
  if (input) {
    if ("command" in input && typeof input.command === "string") {
      brief = input.command.slice(0, 80);
    } else if ("file_path" in input && typeof input.file_path === "string") {
      brief = input.file_path;
    } else if ("pattern" in input && typeof input.pattern === "string") {
      brief = input.pattern;
    } else if ("query" in input && typeof input.query === "string") {
      brief = input.query.slice(0, 80);
    } else if ("description" in input && typeof input.description === "string") {
      brief = input.description.slice(0, 80);
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs hover:text-foreground transition-colors">
        <ChevronRight
          className={cn(
            "h-3 w-3 transition-transform text-muted-foreground",
            open && "rotate-90"
          )}
        />
        <Wrench className="h-3 w-3 text-muted-foreground" />
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {name}
        </Badge>
        {brief && (
          <span className="text-muted-foreground truncate max-w-[200px]">
            {brief}
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-1.5 pl-5 text-[11px] text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto max-h-[300px] overflow-y-auto">
          {JSON.stringify(input, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ToolResultBlock({
  content,
  isError,
  isUser,
}: {
  content?: unknown;
  isError?: boolean;
  isUser: boolean;
}) {
  const [open, setOpen] = useState(false);

  let text = "";
  if (typeof content === "string") {
    text = content;
  } else if (Array.isArray(content)) {
    text = content
      .map((c: { type?: string; text?: string }) =>
        c.type === "text" ? c.text || "" : ""
      )
      .filter(Boolean)
      .join("\n");
  } else if (content) {
    text = JSON.stringify(content, null, 2);
  }

  if (!text) return null;

  const preview = text.slice(0, 60);
  const isTruncated = text.length > 60;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs hover:text-foreground transition-colors">
        <ChevronRight
          className={cn(
            "h-3 w-3 transition-transform text-muted-foreground",
            open && "rotate-90"
          )}
        />
        <Terminal className="h-3 w-3 text-muted-foreground" />
        <span
          className={cn(
            "truncate max-w-[250px]",
            isError ? "text-destructive" : isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {preview}
          {isTruncated && "..."}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-1.5 pl-5 text-[11px] text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap">
          {text}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

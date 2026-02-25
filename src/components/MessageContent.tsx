import type { ContentBlock } from "@/types/conversations";
import { cn } from "@/lib/utils";
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
      {content.map((block, i) => {
        if (block.type === "text") {
          return <MarkdownText key={i} text={block.text || ""} isUser={isUser} />;
        }
        return null;
      })}
    </div>
  );
}

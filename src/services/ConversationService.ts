import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import type { ConversationEntry } from "../types/conversations";

const CLAUDE_PROJECTS_DIR = path.join(homedir(), ".claude", "projects");

function stripXmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, "").trim();
}

function decodeProjectName(dirName: string): string {
  // Try to read sessions-index.json for originalPath first
  const indexPath = path.join(CLAUDE_PROJECTS_DIR, dirName, "sessions-index.json");
  try {
    if (fs.existsSync(indexPath)) {
      const data = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
      if (data.originalPath) return path.basename(data.originalPath);
    }
  } catch {
    // fall through
  }
  // Heuristic: last segment after splitting on common path patterns
  const parts = dirName.replace(/^-/, "").split("-");
  return parts[parts.length - 1] || dirName;
}

function readSessionsIndex(projectDir: string): ConversationEntry[] {
  const indexPath = path.join(projectDir, "sessions-index.json");

  if (!fs.existsSync(indexPath)) {
    return scanJsonlFiles(projectDir);
  }

  try {
    const indexData = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const originalPath: string = indexData.originalPath || "";
    const projectName = path.basename(originalPath);

    return (indexData.entries || [])
      .filter((entry: Record<string, unknown>) => !entry.isSidechain)
      .map((entry: Record<string, unknown>) => ({
        sessionId: entry.sessionId as string,
        fullPath: entry.fullPath as string,
        firstPrompt: stripXmlTags((entry.firstPrompt as string) || "No prompt"),
        summary: entry.summary as string | undefined,
        messageCount: (entry.messageCount as number) || 0,
        created: entry.created as string,
        modified: entry.modified as string,
        gitBranch: entry.gitBranch as string | undefined,
        projectPath: (entry.projectPath as string) || originalPath,
        projectName,
        isSidechain: false,
      }));
  } catch {
    return scanJsonlFiles(projectDir);
  }
}

function scanJsonlFiles(projectDir: string): ConversationEntry[] {
  try {
    const files = fs.readdirSync(projectDir);
    const jsonlFiles = files.filter(
      (f) => f.endsWith(".jsonl") && !f.includes(path.sep)
    );

    const dirName = path.basename(projectDir);
    const projectName = decodeProjectName(dirName);

    return jsonlFiles.map((file) => {
      const fullPath = path.join(projectDir, file);
      const stat = fs.statSync(fullPath);
      const sessionId = file.replace(".jsonl", "");

      let firstPrompt = "No prompt";
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split("\n").slice(0, 20);
        for (const line of lines) {
          if (!line.trim()) continue;
          const parsed = JSON.parse(line);
          if (parsed.type === "user" && !parsed.isMeta && parsed.message?.content) {
            const content = parsed.message.content;
            if (typeof content === "string") {
              firstPrompt = stripXmlTags(content).slice(0, 100);
            } else if (Array.isArray(content)) {
              const textBlock = content.find(
                (b: { type: string }) => b.type === "text"
              );
              if (textBlock?.text) {
                firstPrompt = stripXmlTags(textBlock.text).slice(0, 100);
              }
            }
            break;
          }
        }
      } catch {
        // ignore
      }

      return {
        sessionId,
        fullPath,
        firstPrompt,
        summary: undefined,
        messageCount: 0,
        created: stat.birthtime.toISOString(),
        modified: stat.mtime.toISOString(),
        gitBranch: undefined,
        projectPath: projectDir,
        projectName,
        isSidechain: false,
      };
    });
  } catch {
    return [];
  }
}

export function listConversations(projectDirName?: string): ConversationEntry[] {
  if (!fs.existsSync(CLAUDE_PROJECTS_DIR)) {
    return [];
  }

  let conversations: ConversationEntry[] = [];

  if (projectDirName) {
    const projectDir = path.join(CLAUDE_PROJECTS_DIR, projectDirName);
    if (fs.existsSync(projectDir)) {
      conversations = readSessionsIndex(projectDir);
    }
  } else {
    // All projects
    const entries = fs.readdirSync(CLAUDE_PROJECTS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const projectDir = path.join(CLAUDE_PROJECTS_DIR, entry.name);
      const projectConvos = readSessionsIndex(projectDir);
      conversations.push(...projectConvos);
    }
  }

  // Sort by modified date, most recent first
  conversations.sort(
    (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
  );

  return conversations;
}

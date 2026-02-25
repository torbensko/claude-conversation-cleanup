import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import type { ConversationEntry } from "../types/conversations";

const CLAUDE_PROJECTS_DIR = path.join(homedir(), ".claude", "projects");

function stripXmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, "").trim();
}

const IDE_NOISE_PATTERNS = [
  /^The user opened the file .+$/,
  /^This may or may not be related to the current task\.?$/,
  /^The user is currently viewing/,
  /^The user's cursor is/,
  /^The user has the following file/,
];

function isIdeNoise(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return IDE_NOISE_PATTERNS.some((p) => p.test(trimmed));
}

function cleanPrompt(raw: string): string {
  // Strip XML tags, then filter out IDE noise lines
  const stripped = stripXmlTags(raw);
  const lines = stripped.split(/\n+/).filter((l) => !isIdeNoise(l));
  const cleaned = lines.join(" ").trim();
  return cleaned || stripped;
}

function reconstructPath(dirName: string): string {
  const home = homedir();
  const homePrefix = "-" + home.slice(1).replace(/\//g, "-");
  if (!dirName.startsWith(homePrefix)) return dirName;
  const remainder = dirName.slice(homePrefix.length);
  if (!remainder || remainder === "-") return home;
  const encoded = remainder.slice(1);
  if (!encoded) return home;
  const segments = encoded.split("-");
  let resolved = home;
  let i = 0;
  while (i < segments.length) {
    let matched = false;
    for (let end = segments.length; end > i; end--) {
      const candidate = segments.slice(i, end).join("-");
      const testPath = path.join(resolved, candidate);
      try {
        if (fs.existsSync(testPath)) { resolved = testPath; i = end; matched = true; break; }
      } catch { /* ignore */ }
    }
    if (!matched) { resolved = path.join(resolved, segments.slice(i).join("-")); break; }
  }
  return resolved;
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
  return path.basename(reconstructPath(dirName));
}

function readSessionsIndex(projectDir: string): ConversationEntry[] {
  const indexPath = path.join(projectDir, "sessions-index.json");

  if (!fs.existsSync(indexPath)) {
    return scanJsonlFiles(projectDir);
  }

  try {
    const indexData = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const originalPath: string = indexData.originalPath || "";
    const projectName = path.basename(originalPath) || decodeProjectName(path.basename(projectDir));

    const indexedEntries: ConversationEntry[] = (indexData.entries || [])
      .filter((entry: Record<string, unknown>) => !entry.isSidechain)
      .map((entry: Record<string, unknown>) => ({
        sessionId: entry.sessionId as string,
        fullPath: entry.fullPath as string,
        firstPrompt: cleanPrompt((entry.firstPrompt as string) || "No prompt"),
        summary: entry.summary ? cleanPrompt(entry.summary as string) : undefined,
        messageCount: (entry.messageCount as number) || 0,
        created: entry.created as string,
        modified: entry.modified as string,
        gitBranch: entry.gitBranch as string | undefined,
        projectPath: (entry.projectPath as string) || originalPath,
        projectName,
        isSidechain: false,
      }));

    // Pick up JSONL files not listed in the index
    const indexedIds = new Set(indexedEntries.map((e) => e.sessionId));
    const allJsonl = fs.readdirSync(projectDir).filter(
      (f) => f.endsWith(".jsonl") && !f.includes(path.sep)
    );
    const missingFiles = allJsonl.filter(
      (f) => !indexedIds.has(f.replace(".jsonl", ""))
    );

    if (missingFiles.length > 0) {
      const scanned = scanJsonlFilesWithNames(projectDir, missingFiles, projectName);
      indexedEntries.push(...scanned);
    }

    return indexedEntries;
  } catch {
    return scanJsonlFiles(projectDir);
  }
}

function scanJsonlFiles(projectDir: string): ConversationEntry[] {
  const files = fs.readdirSync(projectDir).filter(
    (f) => f.endsWith(".jsonl") && !f.includes(path.sep)
  );
  const dirName = path.basename(projectDir);
  const projectName = decodeProjectName(dirName);
  return scanJsonlFilesWithNames(projectDir, files, projectName);
}

function scanJsonlFilesWithNames(projectDir: string, jsonlFiles: string[], projectName: string): ConversationEntry[] {
  try {
    return jsonlFiles.map((file) => {
      const fullPath = path.join(projectDir, file);
      const stat = fs.statSync(fullPath);
      const sessionId = file.replace(".jsonl", "");

      let firstPrompt = "No prompt";
      let messageCount = 0;
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if ((parsed.type === "user" || parsed.type === "assistant") && !parsed.isMeta && !parsed.isSidechain) {
              messageCount++;
            }
            if (firstPrompt === "No prompt" && parsed.type === "user" && !parsed.isMeta && parsed.message?.content) {
              const c = parsed.message.content;
              if (typeof c === "string") {
                const cleaned = cleanPrompt(c);
                if (cleaned) firstPrompt = cleaned.slice(0, 100);
              } else if (Array.isArray(c)) {
                // Find first text block that isn't IDE noise
                for (const b of c as Array<{ type: string; text?: string }>) {
                  if (b.type !== "text" || !b.text) continue;
                  const cleaned = cleanPrompt(b.text);
                  if (cleaned && !isIdeNoise(cleaned)) {
                    firstPrompt = cleaned.slice(0, 100);
                    break;
                  }
                }
              }
            }
          } catch {
            // skip unparseable line
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
        messageCount,
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

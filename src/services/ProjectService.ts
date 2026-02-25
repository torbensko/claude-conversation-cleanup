import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import type { ProjectInfo } from "../types/conversations";

const CLAUDE_PROJECTS_DIR = path.join(homedir(), ".claude", "projects");

export function listProjects(): ProjectInfo[] {
  if (!fs.existsSync(CLAUDE_PROJECTS_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(CLAUDE_PROJECTS_DIR, { withFileTypes: true });
  const projects: ProjectInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const projectDir = path.join(CLAUDE_PROJECTS_DIR, entry.name);
    const indexPath = path.join(projectDir, "sessions-index.json");

    let originalPath = "";
    let conversationCount = 0;

    if (fs.existsSync(indexPath)) {
      try {
        const indexData = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        originalPath = indexData.originalPath || "";
        conversationCount = indexData.entries?.length || 0;
      } catch {
        // Fall through to heuristic
      }
    }

    if (!originalPath) {
      // Decode directory name: "-Users-sko-repos-blint" -> "/Users/sko/repos/blint"
      originalPath = "/" + entry.name.slice(1).replace(/-/g, "/");
    }

    if (conversationCount === 0) {
      // Count JSONL files as fallback
      try {
        const files = fs.readdirSync(projectDir);
        conversationCount = files.filter(
          (f) => f.endsWith(".jsonl") && !f.includes("/")
        ).length;
      } catch {
        // ignore
      }
    }

    const projectName = path.basename(originalPath);

    projects.push({
      dirName: entry.name,
      originalPath,
      projectName,
      conversationCount,
    });
  }

  // Sort by project name
  projects.sort((a, b) => a.projectName.localeCompare(b.projectName));

  return projects;
}

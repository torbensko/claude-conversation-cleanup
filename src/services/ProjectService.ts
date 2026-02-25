import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import type { ProjectInfo } from "../types/conversations";

const CLAUDE_PROJECTS_DIR = path.join(homedir(), ".claude", "projects");

/**
 * Reconstruct the original filesystem path from an encoded dir name.
 * Dir names encode paths as `-Users-sko-repos-my-project` for `/Users/sko/repos/my-project`.
 * Since hyphens in real dir names are indistinguishable from path separators,
 * we greedily resolve against the filesystem (longest match first at each level).
 */
function reconstructPath(dirName: string): string {
  const home = homedir();
  const homePrefix = "-" + home.slice(1).replace(/\//g, "-");

  if (!dirName.startsWith(homePrefix)) {
    return dirName;
  }

  const remainder = dirName.slice(homePrefix.length);
  if (!remainder || remainder === "-") return home;

  // remainder starts with "-", strip it
  const encoded = remainder.slice(1);
  if (!encoded) return home;

  const segments = encoded.split("-");
  let resolved = home;
  let i = 0;

  while (i < segments.length) {
    let matched = false;
    // Try longest possible segment first to prefer "blint-christmas" over "blint"/"christmas"
    for (let end = segments.length; end > i; end--) {
      const candidate = segments.slice(i, end).join("-");
      const testPath = path.join(resolved, candidate);
      try {
        if (fs.existsSync(testPath)) {
          resolved = testPath;
          i = end;
          matched = true;
          break;
        }
      } catch {
        // ignore
      }
    }
    if (!matched) {
      // Can't resolve further — append the rest as a single segment
      resolved = path.join(resolved, segments.slice(i).join("-"));
      break;
    }
  }

  return resolved;
}

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
      } catch {
        // Fall through to heuristic
      }
    }

    if (!originalPath) {
      originalPath = reconstructPath(entry.name);
    }

    // Always count actual JSONL files — sessions-index can be stale
    try {
      const files = fs.readdirSync(projectDir);
      conversationCount = files.filter(
        (f) => f.endsWith(".jsonl") && !f.includes("/")
      ).length;
    } catch {
      // ignore
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

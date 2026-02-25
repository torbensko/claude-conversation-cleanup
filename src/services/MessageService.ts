import * as fs from "fs";
import type { Message, DeleteResult } from "../types/conversations";

export function listMessages(filePath: string): Message[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const messages: Message[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const parsed = JSON.parse(line);

      // Skip non-message types
      if (
        parsed.type === "file-history-snapshot" ||
        parsed.type === "queue-operation" ||
        parsed.type === "summary"
      ) {
        continue;
      }

      // Only include user and assistant messages
      if (parsed.type !== "user" && parsed.type !== "assistant") {
        continue;
      }

      // Skip meta messages (system context markers)
      if (parsed.isMeta) {
        continue;
      }

      // Skip sidechain messages
      if (parsed.isSidechain) {
        continue;
      }

      if (!parsed.message) continue;

      messages.push({
        uuid: parsed.uuid || "",
        parentUuid: parsed.parentUuid || null,
        type: parsed.type,
        timestamp: parsed.timestamp || "",
        lineNumber: i,
        isMeta: parsed.isMeta || false,
        isSidechain: parsed.isSidechain || false,
        message: {
          role: parsed.message.role || parsed.type,
          content: parsed.message.content || "",
          model: parsed.message.model || undefined,
        },
      });
    } catch {
      // Skip unparseable lines
    }
  }

  return messages;
}

export function deleteMessagesFrom(
  filePath: string,
  targetUuid: string
): DeleteResult {
  if (!fs.existsSync(filePath)) {
    return { success: false, backupPath: "", deletedCount: 0 };
  }

  // Create backup
  const backupPath = `${filePath}.bak.${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  // Parse all lines to build UUID map
  const lineData: Array<{
    line: string;
    uuid?: string;
    parentUuid?: string | null;
  }> = [];

  for (const line of lines) {
    if (!line.trim()) {
      lineData.push({ line });
      continue;
    }
    try {
      const parsed = JSON.parse(line);
      lineData.push({
        line,
        uuid: parsed.uuid,
        parentUuid: parsed.parentUuid,
      });
    } catch {
      lineData.push({ line });
    }
  }

  // Find target line index
  const targetIndex = lineData.findIndex((d) => d.uuid === targetUuid);
  if (targetIndex === -1) {
    // Target not found, restore and return
    return { success: false, backupPath, deletedCount: 0 };
  }

  // Collect UUIDs to delete: the target and all descendants
  const uuidsToDelete = new Set<string>();
  uuidsToDelete.add(targetUuid);

  // Walk forward finding messages whose parentUuid is in the delete set
  let changed = true;
  while (changed) {
    changed = false;
    for (const data of lineData) {
      if (
        data.uuid &&
        !uuidsToDelete.has(data.uuid) &&
        data.parentUuid &&
        uuidsToDelete.has(data.parentUuid)
      ) {
        uuidsToDelete.add(data.uuid);
        changed = true;
      }
    }
  }

  // Filter out deleted lines
  const remainingLines = lineData
    .filter((d) => !d.uuid || !uuidsToDelete.has(d.uuid))
    .map((d) => d.line);

  // Write back
  fs.writeFileSync(filePath, remainingLines.join("\n"), "utf-8");

  return {
    success: true,
    backupPath,
    deletedCount: uuidsToDelete.size,
  };
}

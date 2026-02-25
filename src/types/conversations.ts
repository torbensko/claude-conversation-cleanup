export interface ProjectInfo {
  dirName: string;
  originalPath: string;
  projectName: string;
  conversationCount: number;
}

export interface ConversationEntry {
  sessionId: string;
  fullPath: string;
  firstPrompt: string;
  summary?: string;
  messageCount: number;
  created: string;
  modified: string;
  gitBranch?: string;
  projectPath: string;
  projectName: string;
  isSidechain: boolean;
}

export interface ContentBlock {
  type: "text" | "thinking" | "tool_use" | "tool_result";
  text?: string;
  thinking?: string;
  name?: string;
  id?: string;
  input?: Record<string, unknown>;
  content?: unknown;
  tool_use_id?: string;
  is_error?: boolean;
}

export interface Message {
  uuid: string;
  parentUuid: string | null;
  type: "user" | "assistant";
  timestamp: string;
  lineNumber: number;
  isMeta?: boolean;
  isSidechain?: boolean;
  message: {
    role: string;
    content: string | ContentBlock[];
    model?: string;
  };
}

export interface DeleteResult {
  success: boolean;
  backupPath: string;
  deletedCount: number;
}

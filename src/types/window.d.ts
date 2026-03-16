import type { ProjectInfo, ConversationEntry, Message, DeleteResult, PlanEntry, PlanDetail } from "./conversations";

export interface ElectronAPI {
  listProjects: () => Promise<ProjectInfo[]>;
  listConversations: (projectDir?: string) => Promise<ConversationEntry[]>;
  listMessages: (filePath: string) => Promise<Message[]>;
  deleteMessagesFrom: (filePath: string, uuid: string) => Promise<DeleteResult>;
  generateSummary: (filePath: string, sessionId: string, projectDir: string) => Promise<{ success: boolean; summary?: string; error?: string }>;
  getApiKey: () => Promise<string | null>;
  setApiKey: (key: string) => Promise<void>;
  listPlans: () => Promise<PlanEntry[]>;
  readPlan: (fullPath: string) => Promise<PlanDetail | null>;
}

declare global {
  const __APP_VERSION__: string;
  interface Window {
    api: ElectronAPI;
  }
}

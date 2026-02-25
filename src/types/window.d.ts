import type { ProjectInfo, ConversationEntry, Message, DeleteResult } from "./conversations";

export interface ElectronAPI {
  listProjects: () => Promise<ProjectInfo[]>;
  listConversations: (projectDir?: string) => Promise<ConversationEntry[]>;
  listMessages: (filePath: string) => Promise<Message[]>;
  deleteMessagesFrom: (filePath: string, uuid: string) => Promise<DeleteResult>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

import { contextBridge, ipcRenderer } from "electron";

const IPC_CHANNELS = {
  PROJECTS_LIST: "projects:list",
  CONVERSATIONS_LIST: "conversations:list",
  MESSAGES_LIST: "messages:list",
  MESSAGES_DELETE_FROM: "messages:deleteFrom",
} as const;

contextBridge.exposeInMainWorld("api", {
  listProjects: () =>
    ipcRenderer.invoke(IPC_CHANNELS.PROJECTS_LIST),

  listConversations: (projectDir?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.CONVERSATIONS_LIST, projectDir),

  listMessages: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.MESSAGES_LIST, filePath),

  deleteMessagesFrom: (filePath: string, uuid: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.MESSAGES_DELETE_FROM, filePath, uuid),
});

import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../types/ipc-channels";
import { listProjects } from "../services/ProjectService";
import { listConversations } from "../services/ConversationService";
import { listMessages, deleteMessagesFrom } from "../services/MessageService";

export function registerIpc() {
  ipcMain.handle(IPC_CHANNELS.PROJECTS_LIST, () => {
    return listProjects();
  });

  ipcMain.handle(
    IPC_CHANNELS.CONVERSATIONS_LIST,
    (_event, projectDir?: string) => {
      return listConversations(projectDir);
    }
  );

  ipcMain.handle(IPC_CHANNELS.MESSAGES_LIST, (_event, filePath: string) => {
    return listMessages(filePath);
  });

  ipcMain.handle(
    IPC_CHANNELS.MESSAGES_DELETE_FROM,
    (_event, filePath: string, uuid: string) => {
      return deleteMessagesFrom(filePath, uuid);
    }
  );
}

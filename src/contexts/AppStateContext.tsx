import { createContext, useContext, useState, type ReactNode } from "react";
import type { ConversationEntry } from "@/types/conversations";

const STORAGE_KEY = "claude-conversations-selected-project";

interface AppState {
  selectedProject: string | null; // null = "All Projects"
  selectedConversation: ConversationEntry | null;
  searchQuery: string;
  setSelectedProject: (project: string | null) => void;
  setSelectedConversation: (conversation: ConversationEntry | null) => void;
  setSearchQuery: (query: string) => void;
}

const AppStateContext = createContext<AppState | null>(null);

function loadSavedProject(): string | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [selectedProject, setSelectedProject] = useState<string | null>(loadSavedProject);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSetProject = (project: string | null) => {
    setSelectedProject(project);
    setSelectedConversation(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      // ignore
    }
  };

  return (
    <AppStateContext.Provider
      value={{
        selectedProject,
        selectedConversation,
        searchQuery,
        setSelectedProject: handleSetProject,
        setSelectedConversation,
        setSearchQuery,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}

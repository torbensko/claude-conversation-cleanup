import { useState, useEffect, useCallback } from "react";
import type { Message } from "@/types/conversations";

export function useMessages(filePath: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMessages = useCallback(() => {
    if (!filePath) {
      setMessages([]);
      return;
    }
    setLoading(true);
    window.api.listMessages(filePath).then((data) => {
      setMessages(data);
      setLoading(false);
    });
  }, [filePath]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return { messages, loading, reload: loadMessages };
}

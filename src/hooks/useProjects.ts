import { useState, useEffect } from "react";
import type { ProjectInfo } from "@/types/conversations";

export function useProjects() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api.listProjects().then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  return { projects, loading };
}

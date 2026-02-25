import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useAppState } from "@/contexts/AppStateContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FolderOpen, Layers, ChevronDown } from "lucide-react";

export function ProjectSelector() {
  const { projects, loading } = useProjects();
  const { selectedProject, setSelectedProject } = useAppState();
  const [open, setOpen] = useState(false);

  const selectedProjectInfo = selectedProject
    ? projects.find((p) => p.dirName === selectedProject)
    : null;

  const displayName = selectedProjectInfo
    ? selectedProjectInfo.projectName
    : "All Projects";

  const totalConversations = projects.reduce(
    (sum, p) => sum + p.conversationCount,
    0
  );

  const handleSelect = (dirName: string | null) => {
    setSelectedProject(dirName);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between gap-2 px-3 h-9 text-sm font-medium"
          disabled={loading}
        >
          <div className="flex items-center gap-2 min-w-0">
            {selectedProject ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{displayName}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-1" align="start">
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-0.5">
            {/* All Projects */}
            <button
              onClick={() => handleSelect(null)}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-left transition-colors",
                selectedProject === null
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Layers className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1">All Projects</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {totalConversations}
              </Badge>
            </button>

            {/* Individual projects */}
            {projects
              .filter((p) => p.conversationCount > 0)
              .map((project) => (
                <button
                  key={project.dirName}
                  onClick={() => handleSelect(project.dirName)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-left transition-colors",
                    selectedProject === project.dirName
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <FolderOpen className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1">
                    {project.projectName}
                  </span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {project.conversationCount}
                  </Badge>
                </button>
              ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

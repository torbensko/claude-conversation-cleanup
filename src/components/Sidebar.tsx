import { ProjectSelector } from "./ProjectSelector";
import { ConversationList } from "./ConversationList";
import { PlanList } from "./PlanList";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Settings, Eye, EyeOff, MessageSquare, ClipboardList } from "lucide-react";
import { useAppState } from "@/contexts/AppStateContext";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { viewMode, setViewMode, searchQuery, setSearchQuery } = useAppState();
  const [apiKeyDisplay, setApiKeyDisplay] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.api.getApiKey().then(setApiKeyDisplay);
  }, []);

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    await window.api.setApiKey(apiKeyInput.trim());
    const display = await window.api.getApiKey();
    setApiKeyDisplay(display);
    setApiKeyInput("");
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* App title + mode toggle + settings */}
      <div className="px-3 pt-3 pb-1 shrink-0 space-y-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              Claude Cleanup
            </h1>
            <p className="text-[10px] text-muted-foreground">v{__APP_VERSION__}</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
                <DialogDescription>
                  Configure your Anthropic API key for AI-powered conversation summaries.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Anthropic API Key</label>
                  {apiKeyDisplay && !apiKeyInput && (
                    <p className="text-xs text-muted-foreground font-mono">{apiKeyDisplay}</p>
                  )}
                  <div className="relative">
                    <Input
                      type={showKey ? "text" : "password"}
                      placeholder="sk-ant-..."
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="pr-9"
                      onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Also auto-detected from <code className="bg-muted px-1 rounded text-[11px]">ANTHROPIC_API_KEY</code> environment variable.
                  </p>
                </div>
                <div className="flex justify-end pt-2 border-t border-border">
                  <Button
                    onClick={handleSaveKey}
                    disabled={!apiKeyInput.trim() || saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg bg-muted/50 p-0.5">
          <button
            onClick={() => setViewMode("conversations")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-colors",
              viewMode === "conversations"
                ? "bg-background text-foreground shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-3 w-3" />
            Chat
          </button>
          <button
            onClick={() => setViewMode("plans")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-colors",
              viewMode === "plans"
                ? "bg-background text-foreground shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ClipboardList className="h-3 w-3" />
            Plans
          </button>
        </div>

        {viewMode === "conversations" && <ProjectSelector />}
      </div>

      <Separator className="my-1" />

      {/* Search */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={viewMode === "plans" ? "Search plans..." : "Search chats..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === "plans" ? <PlanList /> : <ConversationList />}
      </div>
    </div>
  );
}

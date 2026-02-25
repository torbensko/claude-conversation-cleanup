import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppStateProvider } from "@/contexts/AppStateContext";
import { AppLayout } from "@/components/AppLayout";

function App() {
  return (
    <>
      <Toaster richColors closeButton />
      <TooltipProvider>
        <AppStateProvider>
          <AppLayout />
        </AppStateProvider>
      </TooltipProvider>
    </>
  );
}

export default App;

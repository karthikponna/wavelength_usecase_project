import { TooltipProvider } from "@/components/ui/tooltip";
import { Assistant } from "@/assistant/Assistant";
import { AssistantProvider } from "@/assistant/useAssistant";
import { Dashboard } from "@/dashboard/Dashboard";
import { DashboardProvider } from "@/dashboard/state";

export function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <DashboardProvider>
        <AssistantProvider>
          <Dashboard />
          <Assistant />
        </AssistantProvider>
      </DashboardProvider>
    </TooltipProvider>
  );
}

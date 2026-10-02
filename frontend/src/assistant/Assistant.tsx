import { AnimatePresence } from "motion/react";
import { AssistantFab } from "./AssistantFab";
import { ChatPanel } from "./ChatPanel";
import { ConfirmBar } from "./ConfirmBar";
import { MarkerOverlay } from "./MarkerOverlay";
import { Spotlight } from "./Spotlight";
import { useAssistant } from "./useAssistant";
import { WhatsNewPanel } from "./WhatsNewPanel";

export function Assistant() {
  const { panel } = useAssistant();
  return (
    <>
      <Spotlight />
      <MarkerOverlay />
      <ConfirmBar />
      <AnimatePresence>
        {panel === "chat" && <ChatPanel key="chat" />}
        {panel === "whatsNew" && <WhatsNewPanel key="whats-new" />}
      </AnimatePresence>
      <AssistantFab />
    </>
  );
}

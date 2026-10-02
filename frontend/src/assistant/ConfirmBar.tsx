import { useLayoutEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react";
import { ArrowRight, CircleHelp, Sparkles, X } from "lucide-react";
import { useAssistant } from "./useAssistant";

export function ConfirmBar() {
  const { spotlight, sendSelection, cancelSelection } = useAssistant();
  const el = spotlight?.mode === "confirm" ? spotlight.target.element : null;

  const { refs, floatingStyles, placement } = useFloating({
    placement: "right",
    middleware: [offset(16), flip({ fallbackPlacements: ["bottom", "left", "top"] }), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });

  useLayoutEffect(() => {
    refs.setReference(el);
  }, [el, refs]);

  const documented = spotlight?.target.featureId != null;
  const side = placement.split("-")[0];
  const from = { right: { x: -8 }, left: { x: 8 }, bottom: { y: -8 }, top: { y: 8 } }[side] ?? {};

  return (
    <AnimatePresence>
      {el && spotlight && (
        <div key="confirm" data-assistant-ui ref={refs.setFloating} style={floatingStyles} className="z-[60]">
          <motion.div
            key={spotlight.label}
            initial={{ opacity: 0, scale: 0.92, ...from }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 520, damping: 30 }}
            className="flex items-center gap-1.5 rounded-2xl bg-frame p-1.5 pl-3 text-white shadow-2xl shadow-black/40 ring-1 ring-white/10"
          >
            <span className="flex max-w-56 items-center gap-1.5 text-[13px]">
              {documented ? (
                <Sparkles className="size-3.5 shrink-0 text-orange-400" />
              ) : (
                <CircleHelp className="size-3.5 shrink-0 text-white/50" />
              )}
              <span className="truncate font-medium">{spotlight.label}</span>
            </span>
            <button
              type="button"
              aria-label="Cancel selection"
              onClick={cancelSelection}
              className="ml-1 grid size-8 place-items-center rounded-xl bg-white/10 text-white/80 transition-colors hover:bg-white/20"
            >
              <X className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Ask the assistant about this"
              onClick={() => void sendSelection()}
              className="grid size-8 place-items-center rounded-xl bg-orange-500 text-white transition-colors hover:bg-orange-400"
            >
              <ArrowRight className="size-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

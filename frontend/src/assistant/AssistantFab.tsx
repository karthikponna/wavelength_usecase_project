import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircleQuestion, Megaphone, Pencil, Route, Sparkles, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssistant } from "./useAssistant";

type MenuItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  hint: string;
  onSelect?: () => void;
  disabled?: boolean;
};

export function AssistantFab() {
  const { markerOn, startMarker, stopMarker, openAsk, openWhatsNew, panel, closePanel } = useAssistant();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);

  const show = () => {
    window.clearTimeout(closeTimer.current);
    if (!markerOn) setOpen(true);
  };
  const hide = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  };

  const pick = (fn?: () => void) => () => {
    setOpen(false);
    fn?.();
  };

  const items: MenuItem[] = [
    { id: "marker", icon: Pencil, label: "Mark it", hint: "Circle anything you don't get", onSelect: startMarker },
    { id: "ask", icon: MessageCircleQuestion, label: "Ask", hint: "Chat about this page", onSelect: openAsk },
    { id: "whats-new", icon: Megaphone, label: "What's new", hint: "Recently shipped features", onSelect: openWhatsNew },
    { id: "show-me", icon: Route, label: "Show me how", hint: "Coming soon", disabled: true },
  ];

  const active = markerOn || panel !== null;

  const onFabClick = () => {
    if (markerOn) return stopMarker();
    if (panel) return closePanel();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      data-assistant-ui
      className="fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-3"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <AnimatePresence>
        {open && !markerOn && (
          <motion.ul
            role="menu"
            className="flex flex-col items-end gap-2"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{ visible: { transition: { staggerChildren: 0.04, staggerDirection: -1 } }, hidden: {} }}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <motion.li
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, y: 10, scale: 0.96 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ type: "spring", stiffness: 520, damping: 32 }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={pick(item.onSelect)}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white py-2 pl-3 pr-2 text-left text-zinc-900 shadow-lg shadow-zinc-900/8 transition-colors",
                      item.disabled ? "cursor-not-allowed [&>*]:opacity-50" : "hover:bg-zinc-50",
                    )}
                  >
                    <span className="flex flex-col">
                      <span className="text-[13px] font-medium">{item.label}</span>
                      <span className="text-[11px] text-zinc-500">{item.hint}</span>
                    </span>
                    <span
                      className={cn(
                        "grid size-9 place-items-center rounded-xl bg-zinc-100 text-zinc-700",
                        item.id === "marker" && "bg-orange-500 text-white",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label={active ? "Close assistant" : "Open assistant"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onFabClick}
        onFocus={show}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative grid size-14 place-items-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 transition-colors hover:bg-orange-600"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={active ? "x" : "spark"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            {active ? <X className="size-5" /> : <Sparkles className="size-5" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

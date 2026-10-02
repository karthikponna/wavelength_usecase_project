import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Crosshair, Megaphone, X } from "lucide-react";
import type { WhatsNewItem } from "@shared/types";
import { useAssistant } from "./useAssistant";

function shippedLabel(date: string) {
  const days = Math.round((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (days <= 0) return "Shipped today";
  if (days === 1) return "Shipped yesterday";
  if (days < 45) return `Shipped ${days} days ago`;
  return `Shipped ${new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

function findOnPage(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-feature="${id}"]`);
}

export function WhatsNewPanel() {
  const { closePanel, spotlightElement } = useAssistant();
  const [items, setItems] = useState<WhatsNewItem[] | null>(null);

  useEffect(() => {
    fetch("/api/features/whats-new")
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <motion.section
      data-assistant-ui
      role="dialog"
      aria-label="What's new"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      style={{ transformOrigin: "bottom right" }}
      className="fixed bottom-24 right-6 z-[70] flex max-h-[min(560px,calc(100vh-8rem))] w-[380px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10"
    >
      <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 text-zinc-900">
        <span className="grid size-8 place-items-center rounded-xl bg-orange-50">
          <Megaphone className="size-4 text-orange-500" />
        </span>
        <div className="flex-1">
          <div className="text-[13px] font-semibold">What's new</div>
          <div className="text-[11px] text-zinc-500">Recently shipped in Wavelength</div>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={closePanel}
          className="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <X className="size-4" />
        </button>
      </header>

      <ul className="divide-y divide-zinc-100 overflow-y-auto">
        {items === null &&
          [0, 1, 2].map((i) => (
            <li key={i} className="space-y-2 px-4 py-3">
              <div className="h-3.5 w-32 animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
            </li>
          ))}
        {items?.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-zinc-500">Nothing new yet.</li>}
        {items?.map((item) => {
          const onPage = Boolean(findOnPage(item.id));
          return (
            <li key={item.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-zinc-900">{item.name}</span>
                {item.isNew && (
                  <span className="rounded-full bg-orange-500 px-1.5 py-px text-[10px] font-semibold uppercase text-white">New</span>
                )}
                <span className="ml-auto text-[11px] text-zinc-400">{shippedLabel(item.shippedOn)}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-zinc-600">{item.whatItDoes}</p>
              <button
                type="button"
                disabled={!onPage}
                onClick={() => {
                  const el = findOnPage(item.id);
                  if (el) spotlightElement(el);
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <Crosshair className="size-3" /> {onPage ? "Show me" : "Not on this page"}
              </button>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}

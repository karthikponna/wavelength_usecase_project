import type { PageContext, Selection } from "@shared/types";
import type { DetectedTarget } from "./detect-target";
import { visibleFeatureElements } from "./detect-target";

const clean = (s: string | null | undefined, max = 600) =>
  (s ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export function describeElement(el: HTMLElement): string {
  return clean(el.getAttribute("aria-label") || el.innerText || el.getAttribute("title"), 60) || el.tagName.toLowerCase();
}

export function collectSelection(target: DetectedTarget, label: string): Omit<Selection, "screenshot"> {
  const el = target.element;
  const row = el.closest("tr");
  const section = el.closest<HTMLElement>("[data-section]");
  const nearby = [row ? `Row: ${clean(row.innerText, 250)}` : "", section ? `${section.dataset.section}: ${clean(section.innerText)}` : ""]
    .filter(Boolean)
    .join("\n");

  return {
    featureId: target.featureId,
    label,
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute("role") ?? undefined,
    text: clean(el.innerText, 200),
    ariaLabel: el.getAttribute("aria-label") ?? undefined,
    nearbyText: nearby,
    candidates: target.candidates,
  };
}

export function collectPage(page: { id: string; title: string }, liveState: Record<string, unknown>): PageContext {
  const ids = new Set(visibleFeatureElements().map((el) => el.dataset.feature!));
  return { id: page.id, title: page.title, visibleFeatureIds: [...ids], liveState };
}

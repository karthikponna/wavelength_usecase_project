import { boundingBox, center, isTap, rankCandidates, type Point } from "./geometry";

export type DetectedTarget = {
  element: HTMLElement;
  featureId: string | null;
  candidates: string[];
};

const ASSISTANT_UI = "[data-assistant-ui]";
const INTERACTIVE = "button, a, [role=button], input, select, textarea, label";

function isVisible(el: HTMLElement, rect: DOMRect): boolean {
  if (rect.width === 0 || rect.height === 0) return false;
  if (rect.bottom < 0 || rect.right < 0 || rect.top > innerHeight || rect.left > innerWidth) return false;
  if (el.closest(ASSISTANT_UI)) return false;
  return true;
}

/** Elements under a point, ignoring the assistant's own overlays. */
function pageElementsAt(p: Point): HTMLElement[] {
  return document
    .elementsFromPoint(p.x, p.y)
    .filter((el): el is HTMLElement => el instanceof HTMLElement && !el.closest(ASSISTANT_UI));
}

function fromPoint(p: Point): DetectedTarget | null {
  for (const el of pageElementsAt(p)) {
    const feature = el.closest<HTMLElement>("[data-feature]");
    if (feature) return { element: feature, featureId: feature.dataset.feature ?? null, candidates: [] };
    const interactive = el.closest<HTMLElement>(INTERACTIVE);
    if (interactive) return { element: interactive, featureId: null, candidates: [] };
  }
  return null;
}

export function visibleFeatureElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-feature]")).filter((el) =>
    isVisible(el, el.getBoundingClientRect()),
  );
}

export function detectTarget(stroke: Point[]): DetectedTarget | null {
  if (stroke.length === 0) return null;
  if (isTap(stroke)) return fromPoint(stroke[stroke.length - 1]);

  const ranked = rankCandidates(
    stroke,
    visibleFeatureElements().map((el) => ({ item: el, rect: el.getBoundingClientRect() })),
  );

  if (ranked.length > 0) {
    const best = ranked[0].item;
    const candidates = [...new Set(ranked.slice(0, 3).map((c) => c.item.dataset.feature!))];
    return { element: best, featureId: best.dataset.feature ?? null, candidates };
  }

  // Nothing tagged inside the loop: fall back to whatever interactive element sits at its center.
  return fromPoint(center(boundingBox(stroke)));
}

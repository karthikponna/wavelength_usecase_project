import { useEffect, useState } from "react";

export type TrackedRect = { x: number; y: number; width: number; height: number };

/** Follows an element's viewport rect every frame (covers scroll, resize and table re-sorts). */
export function useTrackedRect(el: HTMLElement | null): TrackedRect | null {
  const [rect, setRect] = useState<TrackedRect | null>(null);

  useEffect(() => {
    if (!el) {
      setRect(null);
      return;
    }
    let frame = 0;
    let last: TrackedRect | null = null;
    const tick = () => {
      const r = el.getBoundingClientRect();
      if (!last || r.x !== last.x || r.y !== last.y || r.width !== last.width || r.height !== last.height) {
        last = { x: r.x, y: r.y, width: r.width, height: r.height };
        setRect(last);
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [el]);

  return rect;
}

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getStroke } from "perfect-freehand";
import gsap from "gsap";
import { Pencil } from "lucide-react";
import { useAssistant } from "./useAssistant";

const MARKER_CURSOR = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" fill="#f97316" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/><path d="m15 5 4 4" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 3 25, crosshair`;
})();

function toSvgPath(stroke: number[][]): string {
  if (stroke.length < 4) return "";
  const avg = (a: number, b: number) => (a + b) / 2;
  let d = `M${stroke[0][0].toFixed(2)},${stroke[0][1].toFixed(2)} Q`;
  for (let i = 0; i < stroke.length; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[(i + 1) % stroke.length];
    d += `${x0.toFixed(2)},${y0.toFixed(2)} ${avg(x0, x1).toFixed(2)},${avg(y0, y1).toFixed(2)} `;
  }
  return `${d}Z`;
}

export function MarkerOverlay() {
  const { markerOn, handleStroke, spotlight, cancelSelection } = useAssistant();
  const [points, setPoints] = useState<number[][]>([]);
  const [missed, setMissed] = useState(false);
  const drawing = useRef(false);
  const pointsRef = useRef<number[][]>([]);
  const pressureRef = useRef(true);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!markerOn) {
      setPoints([]);
      setMissed(false);
    }
  }, [markerOn]);

  const reset = (path: SVGPathElement | null) => {
    if (path) gsap.killTweensOf(path);
    if (path) gsap.set(path, { opacity: 1, x: 0 });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can't be captured; drawing still works without it.
    }
    if (spotlight?.mode === "confirm") cancelSelection();
    reset(pathRef.current);
    setMissed(false);
    drawing.current = true;
    pressureRef.current = e.pointerType !== "pen";
    pointsRef.current = [[e.clientX, e.clientY, e.pressure || 0.5]];
    setPoints(pointsRef.current);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drawing.current) return;
    pointsRef.current = [...pointsRef.current, [e.clientX, e.clientY, e.pressure || 0.5]];
    setPoints(pointsRef.current);
  };

  const onPointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const found = handleStroke(pointsRef.current.map(([x, y]) => ({ x, y })));
    const path = pathRef.current;
    if (!path) return;
    if (found) {
      gsap.to(path, { opacity: 0, duration: 0.55, delay: 0.25, ease: "power2.out", onComplete: () => setPoints([]) });
    } else {
      setMissed(true);
      gsap
        .timeline({ onComplete: () => setPoints([]) })
        .to(path, { x: -6, duration: 0.05, repeat: 5, yoyo: true, ease: "none" })
        .to(path, { x: 0, opacity: 0, duration: 0.4 });
    }
  };

  const outline = getStroke(points, {
    size: 7,
    thinning: 0.45,
    smoothing: 0.6,
    streamline: 0.5,
    simulatePressure: pressureRef.current,
  });

  return (
    <AnimatePresence>
      {markerOn && (
        <motion.div
          data-assistant-ui
          key="marker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 touch-none select-none"
          style={{ cursor: MARKER_CURSOR }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <svg className="pointer-events-none absolute inset-0 size-full">
            <defs>
              <filter id="marker-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#f97316" floodOpacity="0.55" />
              </filter>
            </defs>
            <path ref={pathRef} d={toSvgPath(outline)} fill="#f97316" filter="url(#marker-glow)" />
          </svg>

          <div className="pointer-events-none absolute inset-x-0 top-5 flex justify-center">
            <AnimatePresence mode="wait">
              {!spotlight && (
                <motion.div
                  key={missed ? "miss" : "hint"}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 rounded-full bg-frame/95 px-4 py-2 text-[13px] text-white shadow-xl ring-1 ring-white/10"
                >
                  <Pencil className="size-3.5 text-orange-400" />
                  {missed
                    ? "Couldn't find a feature there. Try circling a button or a card."
                    : "Circle anything you don't understand"}
                  <kbd className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white/70">Esc</kbd>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

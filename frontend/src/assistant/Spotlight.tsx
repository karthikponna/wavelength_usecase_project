import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import gsap from "gsap";
import { useAssistant } from "./useAssistant";
import { useTrackedRect, type TrackedRect } from "./useTrackedRect";

const PAD = 6;
const RADIUS = 12;

function useViewport() {
  const [size, setSize] = useState({ w: innerWidth, h: innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: innerWidth, h: innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

function holePath(r: TrackedRect, w: number, h: number) {
  const x = r.x - PAD;
  const y = r.y - PAD;
  const x2 = r.x + r.width + PAD;
  const y2 = r.y + r.height + PAD;
  const k = Math.min(RADIUS, (x2 - x) / 2, (y2 - y) / 2);
  return `path(evenodd, "M0 0 H${w} V${h} H0 Z M${x + k} ${y} H${x2 - k} A${k} ${k} 0 0 1 ${x2} ${y + k} V${y2 - k} A${k} ${k} 0 0 1 ${x2 - k} ${y2} H${x + k} A${k} ${k} 0 0 1 ${x} ${y2 - k} V${y + k} A${k} ${k} 0 0 1 ${x + k} ${y} Z")`;
}

function Ring({ rect, pinned, targetKey }: { rect: TrackedRect; pinned: boolean; targetKey: HTMLElement }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const tween = gsap.fromTo(
      ref.current,
      { scale: 1.35, opacity: 0, rotate: -2 },
      { scale: 1, opacity: 1, rotate: 0, duration: 0.55, ease: "back.out(2.2)" },
    );
    return () => {
      tween.kill();
    };
  }, [targetKey]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-[45] rounded-xl border-2 border-orange-500"
      style={{
        left: rect.x - PAD,
        top: rect.y - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
        boxShadow: pinned
          ? "0 0 0 4px rgb(249 115 22 / 0.18)"
          : "0 0 0 6px rgb(249 115 22 / 0.22), 0 0 32px 4px rgb(249 115 22 / 0.45)",
      }}
    />
  );
}

export function Spotlight() {
  const { spotlight, cancelSelection, markerOn } = useAssistant();
  const el = spotlight?.target.element ?? null;
  const rect = useTrackedRect(el);
  const { w, h } = useViewport();
  const confirming = spotlight?.mode === "confirm";

  return (
    <div data-assistant-ui>
      <AnimatePresence>
        {confirming && rect && (
          <motion.div
            key="blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={markerOn ? undefined : cancelSelection}
            className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-[2px]"
            style={{ clipPath: holePath(rect, w, h) }}
          />
        )}
      </AnimatePresence>
      {spotlight && rect && el && <Ring rect={rect} pinned={!confirming} targetKey={el} />}
    </div>
  );
}

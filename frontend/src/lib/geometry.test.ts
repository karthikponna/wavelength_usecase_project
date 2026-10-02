import { describe, expect, test } from "bun:test";
import { center, isTap, pointInPolygon, rankCandidates, type Point, type Rect } from "./geometry";

function loopAround(r: Rect, padding = 10, wobble = 0, steps = 40): Point[] {
  const c = center(r);
  const rx = r.width / 2 + padding;
  const ry = r.height / 2 + padding;
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const w = 1 + wobble * Math.sin(i * 1.7);
    pts.push({ x: c.x + Math.cos(t) * rx * w, y: c.y + Math.sin(t) * ry * w });
  }
  return pts;
}

// Mirrors the header bar: three adjacent buttons.
const add: Rect = { x: 900, y: 20, width: 60, height: 32 };
const view: Rect = { x: 968, y: 20, width: 70, height: 32 };
const signalRank: Rect = { x: 1046, y: 20, width: 120, height: 32 };
const header: Rect = { x: 600, y: 12, width: 580, height: 48 };

const candidates = [
  { item: "add-account", rect: add },
  { item: "view-options", rect: view },
  { item: "signal-rank", rect: signalRank },
];

describe("rankCandidates", () => {
  test("a clean circle picks the enclosed button", () => {
    const ranked = rankCandidates(loopAround(signalRank), candidates);
    expect(ranked[0].item).toBe("signal-rank");
  });

  test("a loose, wobbly circle still picks the right button", () => {
    const ranked = rankCandidates(loopAround(signalRank, 18, 0.15), candidates);
    expect(ranked[0].item).toBe("signal-rank");
  });

  test("a circle partly off-center still favors the button mostly inside", () => {
    const shifted = loopAround({ ...signalRank, x: signalRank.x - 18 }, 8);
    const ranked = rankCandidates(shifted, candidates);
    expect(ranked[0].item).toBe("signal-rank");
  });

  test("nested elements: circling the button beats its large container", () => {
    const ranked = rankCandidates(loopAround(view), [
      ...candidates,
      { item: "header", rect: header },
    ]);
    expect(ranked[0].item).toBe("view-options");
  });

  test("circling the whole header prefers the container over one button", () => {
    const ranked = rankCandidates(loopAround(header, 6), [
      ...candidates,
      { item: "header", rect: header },
    ]);
    expect(ranked[0].item).toBe("header");
  });

  test("a circle covering two buttons returns both as top candidates", () => {
    const both: Rect = { x: add.x, y: add.y, width: view.x + view.width - add.x, height: add.height };
    const ranked = rankCandidates(loopAround(both, 6), candidates);
    const top2 = ranked.slice(0, 2).map((c) => c.item).sort();
    expect(top2).toEqual(["add-account", "view-options"]);
    expect(ranked.find((c) => c.item === "signal-rank")).toBeUndefined();
  });

  test("a circle on empty space matches nothing", () => {
    const empty: Rect = { x: 200, y: 400, width: 80, height: 40 };
    expect(rankCandidates(loopAround(empty), candidates)).toEqual([]);
  });

  test("an element barely touched by the circle is ignored", () => {
    const ranked = rankCandidates(loopAround({ x: 1150, y: 20, width: 60, height: 32 }, 4), candidates);
    expect(ranked.find((c) => c.item === "signal-rank")).toBeUndefined();
  });
});

describe("isTap", () => {
  test("a few points close together is a tap", () => {
    expect(isTap([{ x: 10, y: 10 }, { x: 13, y: 12 }, { x: 11, y: 14 }])).toBe(true);
  });

  test("a real stroke is not a tap", () => {
    expect(isTap(loopAround(signalRank))).toBe(false);
  });
});

describe("pointInPolygon", () => {
  test("detects the center of a drawn loop", () => {
    expect(pointInPolygon(center(signalRank), loopAround(signalRank))).toBe(true);
    expect(pointInPolygon({ x: 0, y: 0 }, loopAround(signalRank))).toBe(false);
  });
});

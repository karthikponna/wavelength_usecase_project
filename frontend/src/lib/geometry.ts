export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };

export type ScoredCandidate<T> = {
  item: T;
  rect: Rect;
  coverage: number;
  fill: number;
  score: number;
};

export const TAP_THRESHOLD = 12;
export const MIN_COVERAGE = 0.4;
const CENTER_BONUS = 1.25;

export function boundingBox(points: Point[]): Rect {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function isTap(points: Point[]): boolean {
  if (points.length === 0) return false;
  const b = boundingBox(points);
  return Math.hypot(b.width, b.height) < TAP_THRESHOLD;
}

export function area(r: Rect): number {
  return Math.max(0, r.width) * Math.max(0, r.height);
}

export function intersection(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

export function center(r: Rect): Point {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

/** Ray casting; the stroke is treated as a closed polygon. */
export function pointInPolygon(p: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

export function expand(r: Rect, by: number): Rect {
  return { x: r.x - by, y: r.y - by, width: r.width + by * 2, height: r.height + by * 2 };
}

/**
 * Ranks candidate rects by how well they match a drawn stroke.
 * coverage: share of the element inside the stroke's box (did the user enclose it?)
 * fill: share of the stroke's box taken up by the element (is it the thing they meant, or something tiny inside?)
 */
export function rankCandidates<T>(
  stroke: Point[],
  candidates: { item: T; rect: Rect }[],
): ScoredCandidate<T>[] {
  if (stroke.length < 2) return [];
  const box = expand(boundingBox(stroke), 8);
  const boxArea = area(box);
  if (boxArea === 0) return [];

  const scored: ScoredCandidate<T>[] = [];
  for (const c of candidates) {
    const elArea = area(c.rect);
    if (elArea === 0) continue;
    const inter = intersection(c.rect, box);
    if (inter === 0) continue;
    const coverage = inter / elArea;
    if (coverage < MIN_COVERAGE) continue;
    const fill = inter / boxArea;
    let score = coverage * fill;
    if (pointInPolygon(center(c.rect), stroke)) score *= CENTER_BONUS;
    scored.push({ item: c.item, rect: c.rect, coverage, fill, score });
  }

  return scored.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 1e-6) return b.score - a.score;
    return area(a.rect) - area(b.rect);
  });
}
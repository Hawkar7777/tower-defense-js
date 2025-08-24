import { TILE, MAP_GRID_W, MAP_GRID_H } from "./core.js";
import { lerp } from "./utils.js";

// We'll compute path after canvas size sync. Export initPath to call from main.
export let path = [];
export let segLens = [];
export let totalLen = 0;
export const blocked = new Set();

// --- REFACTORED FUNCTION ---
// It now takes a function that generates the path array.
export function initPath(levelPathGenerator) {
  // If no path generator is provided, reset the path.
  if (!levelPathGenerator) {
    path = [];
    segLens = [];
    totalLen = 0;
    blocked.clear();
    return;
  }

  // Calculate pixel dimensions based on current grid size
  const MAP_W = MAP_GRID_W * TILE;
  const MAP_H = MAP_GRID_H * TILE;
  const T_HALF = TILE / 2;

  // Call the provided function to get the path for the current level
  path = levelPathGenerator(TILE, T_HALF, MAP_W, MAP_H);

  // This part correctly calculates lengths and blocked tiles for the new path
  segLens.length = 0;
  totalLen = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i],
      b = path[i + 1];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    segLens.push(L);
    totalLen += L;
  }

  blocked.clear();
  for (let i = 0; i < totalLen; i += TILE * 0.6) {
    const p = pointAt(i / totalLen);
    const gx = Math.floor(p.x / TILE),
      gy = Math.floor(p.y / TILE);
    blocked.add(`${gx},${gy}`);
  }
}

/**
 * Calculates a point along the path.
 * @param {number} t - A value from 0 (start) to 1 (end).
 * @returns {{x: number, y: number}} The coordinates of the point.
 */
export function pointAt(t) {
  if (totalLen === 0) return { x: 0, y: 0 };
  let d = t * totalLen;
  for (let i = 0; i < segLens.length; i++) {
    if (d <= segLens[i]) {
      const a = path[i],
        b = path[i + 1];
      const r = d / segLens[i];
      return { x: lerp(a.x, b.x, r), y: lerp(a.y, b.y, r) };
    }
    d -= segLens[i];
  }
  // If t is 1 or slightly more, return the last point
  return { ...path[path.length - 1] };
}

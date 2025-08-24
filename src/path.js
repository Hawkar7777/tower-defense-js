// path.js

import { TILE, MAP_GRID_W, MAP_GRID_H } from "./core.js";
import { lerp } from "./utils.js";

// We'll compute path after canvas size sync. Export initPath to call from main.
export let path = [];
export let segLens = [];
export let totalLen = 0;
export const blocked = new Set();

// --- NEW FUNCTION: Generates a smooth curve through a set of points ---
/**
 * Generates a Catmull-Rom spline through a series of points.
 * @param {Array<{x: number, y: number}>} points - The array of points to pass through.
 * @param {number} numPoints - The number of points to generate for the final curve.
 * @returns {Array<{x: number, y: number}>} - The array of points forming the smooth curve.
 */
function generateSpline(points, numPoints = 1000) {
  const curvedPath = [];
  const tension = 0.5; // Catmull-Rom tension. 0.5 is standard.

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[i] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i === points.length - 2 ? points[i + 1] : points[i + 2];

    const numSegments = Math.floor(numPoints / (points.length - 1));

    for (let j = 0; j < numSegments; j++) {
      const t = j / numSegments;
      const t2 = t * t;
      const t3 = t2 * t;

      const c1 = -tension * t3 + 2 * tension * t2 - tension * t;
      const c2 = (2 - tension) * t3 + (tension - 3) * t2 + 1;
      const c3 = (tension - 2) * t3 + (3 - 2 * tension) * t2 + tension * t;
      const c4 = tension * t3 - tension * t2;

      const x = c1 * p0.x + c2 * p1.x + c3 * p2.x + c4 * p3.x;
      const y = c1 * p0.y + c2 * p1.y + c3 * p2.y + c4 * p3.y;

      curvedPath.push({ x, y });
    }
  }
  curvedPath.push(points[points.length - 1]); // Ensure the last point is included
  return curvedPath;
}

// --- MODIFIED FUNCTION ---
export function initPath(levelPathGenerator) {
  if (!levelPathGenerator) {
    path = [];
    segLens = [];
    totalLen = 0;
    blocked.clear();
    return;
  }

  const MAP_W = MAP_GRID_W * TILE;
  const MAP_H = MAP_GRID_H * TILE;
  const T_HALF = TILE / 2;

  // Generate the original straight-line path
  const roughPath = levelPathGenerator(TILE, T_HALF, MAP_W, MAP_H);

  // Generate the smooth curve from the rough path
  if (roughPath.length > 1) {
    path = generateSpline(roughPath);
  } else {
    path = roughPath;
  }

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
  if (totalLen === 0 || !path.length) return { x: 0, y: 0 };
  let d = t * totalLen;
  for (let i = 0; i < segLens.length; i++) {
    if (d <= segLens[i]) {
      const a = path[i],
        b = path[i + 1];
      const r = segLens[i] === 0 ? 0 : d / segLens[i]; // Avoid division by zero
      return { x: lerp(a.x, b.x, r), y: lerp(a.y, b.y, r) };
    }
    d -= segLens[i];
  }
  // If t is 1 or slightly more, return the last point
  return { ...path[path.length - 1] };
}

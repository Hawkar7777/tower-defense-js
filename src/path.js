// ===== FILE: path.js =====

// path.js

import { TILE, MAP_GRID_W, MAP_GRID_H } from "./core.js";
import { lerp } from "./utils.js";
import { getBlockedCellsFromMap, getPathFromMap } from "./map/mapRenderer.js"; // Import new map functions

// We'll compute path after canvas size sync. Export initPath to call from main.
export let path = [];
export let segLens = [];
export let totalLen = 0;
export let blocked = new Set(); // Changed to 'let' so it can be reassigned

// --- NEW FUNCTION: Generates a smooth curve through a set of points ---
/**
 * Generates a Catmull-Rom spline through a series of points.
 * @param {Array<{x: number, y: number}>} points - The array of points to pass through.
 * @param {number} numPoints - The number of points to generate for the final curve.
 * @returns {Array<{x: number, y: number}>} - The array of points forming the smooth curve.
 */
function generateSpline(points, numPoints = 100) {
  // Reduced numPoints for performance, adjust if needed
  const curvedPath = [];
  const tension = 0.5; // Catmull-Rom tension. 0.5 is standard.

  // Need at least 4 points for a full Catmull-Rom segment,
  // handle edge cases for fewer points or just use linear interpolation if too few.
  if (points.length < 2) return points;
  if (points.length < 4) {
    // For 2 or 3 points, just connect them linearly for simplicity
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      for (let j = 0; j <= numPoints / (points.length - 1); j++) {
        const t = j / (numPoints / (points.length - 1));
        curvedPath.push({ x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) });
      }
    }
    return curvedPath;
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[i] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i === points.length - 2 ? points[i + 1] : points[i + 2];

    // Ensure numSegments is at least 1
    const numSegments = Math.max(
      1,
      Math.floor(numPoints / (points.length - 1))
    );

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
// Now takes no arguments and gets path/blocked tiles from the mapRenderer
export function initPath() {
  const roughPath = getPathFromMap(); // Get path points directly from the map
  blocked = getBlockedCellsFromMap(); // Get blocked cells directly from the map

  if (!roughPath || roughPath.length < 2) {
    path = [];
    segLens = [];
    totalLen = 0;
    return;
  }

  // Generate the smooth curve from the rough path
  path = generateSpline(roughPath);

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

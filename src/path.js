import { TILE } from "./core.js";
import { lerp } from "./utils.js";
import { GRID_W, GRID_H, W as _W, H as _H } from "./core.js";
import { syncLogicalSize } from "./core.js";

// We'll compute path after canvas size sync. Export initPath to call from main.
export let path = [];
export let segLens = [];
export let totalLen = 0;
export const blocked = new Set();

export function initPath() {
  // Ensure canvas sizes are current
  // (main will call syncLogicalSize before this)
  const W = Math.max(
    1,
    Math.floor((document.querySelector("#game").clientWidth || 1100) / TILE) *
      TILE
  );
  const H = Math.max(
    1,
    Math.floor((document.querySelector("#game").clientHeight || 650) / TILE) *
      TILE
  );

  path = [
    { x: 0, y: H * 0.65 },
    { x: W * 0.18, y: H * 0.65 },
    { x: W * 0.18, y: H * 0.2 },
    { x: W * 0.45, y: H * 0.2 },
    { x: W * 0.45, y: H * 0.8 },
    { x: W * 0.72, y: H * 0.8 },
    { x: W * 0.72, y: H * 0.35 },
    { x: W * 0.98, y: H * 0.35 },
  ];

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
  return { ...path[path.length - 1] };
}

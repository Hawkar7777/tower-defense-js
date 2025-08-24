export const DPR = Math.min(2, window.devicePixelRatio || 1);
export const TILE = 40;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.5;

// Change from 'const' to 'let' to allow modification
export let MAP_GRID_W = 50; // Default width
export let MAP_GRID_H = 30; // Default height

export let GRID_W = 0;
export let GRID_H = 0;
export let W = 0;
export let H = 0;

// --- NEW FUNCTION ---
// This function allows us to set the map size from outside this module.
export function setMapDimensions(width, height) {
  MAP_GRID_W = width;
  MAP_GRID_H = height;
}

export const canvas = document.createElement("canvas");
canvas.id = "game";
canvas.style.width = "100%";
canvas.style.display = "none";
canvas.style.background = "#0b0f1a";
canvas.style.boxShadow =
  "0 30px 60px rgba(0,0,0,0.35), inset 0 0 120px rgba(0,180,255,0.04)";
document.body.appendChild(canvas);
export const ctx = canvas.getContext("2d");

function computeGrid() {
  GRID_W = Math.floor(canvas.clientWidth / TILE);
  GRID_H = Math.floor(canvas.clientHeight / TILE);
  W = GRID_W * TILE;
  H = GRID_H * TILE;
}

export function resize() {
  // This will calculate the VISIBLE grid based on the full screen size...
  computeGrid();
  // ...and this will resize the actual canvas to perfectly fit that visible grid.
  syncLogicalSize();
}
window.addEventListener("resize", resize);

export function syncLogicalSize() {
  computeGrid();
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

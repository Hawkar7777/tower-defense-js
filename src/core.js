// ===== FILE: core.js =====

// --- MODIFIED ---
// Find the canvas from the HTML instead of creating a new one.
export const canvas = document.getElementById("game");
if (!canvas) {
  throw new Error(
    "Fatal Error: Canvas element with id 'game' was not found in the HTML."
  );
}
export const ctx = canvas.getContext("2d");

export const DPR = Math.min(2, window.devicePixelRatio || 1);
export const TILE = 40; // This should match the tilewidth/tileheight in your .tmj file
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.5;

// Change from 'const' to 'let' to allow modification
export let MAP_GRID_W = 50; // Default width, will be updated by loaded map
export let MAP_GRID_H = 30; // Default height, will be updated by loaded map

// This function allows us to set the map size from outside this module.
export function setMapDimensions(width, height) {
  MAP_GRID_W = width;
  MAP_GRID_H = height;
}

export function resize() {
  // The canvas's logical size should be its client dimensions.
  // The map's dimensions (MAP_GRID_W * TILE) define the scrollable "world".
  syncLogicalSize();
}
window.addEventListener("resize", resize);

export function syncLogicalSize() {
  canvas.width = Math.floor(canvas.clientWidth * DPR);
  canvas.height = Math.floor(canvas.clientHeight * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

// Initial call to set up canvas
syncLogicalSize(); // Moved here to be called once on load

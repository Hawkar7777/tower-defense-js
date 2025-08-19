// Canvas, sizing and basic exports
export const DPR = Math.min(2, window.devicePixelRatio || 1);
export const TILE = 40;
export let GRID_W = 0;
export let GRID_H = 0;
export let W = 0;
export let H = 0;

export const canvas = document.createElement("canvas");
canvas.id = "game";
canvas.style.width = "100%";
canvas.style.maxWidth = "1100px";
canvas.style.height = "650px";
canvas.style.display = "block";
canvas.style.margin = "24px auto";
canvas.style.background = "#0b0f1a";
canvas.style.borderRadius = "16px";
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
  const w = Math.min(window.innerWidth - 32, 1100);
  const h = 650;
  canvas.width = Math.floor(w * DPR);
  canvas.height = Math.floor(h * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  computeGrid();
}
window.addEventListener("resize", resize);

export function syncLogicalSize() {
  computeGrid();
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}


import { pulses } from "./state.js";
import { ctx } from "./core.js";

export const TAU = Math.PI * 2;
export const rand = (a = 1, b = 0) => Math.random() * (a - b) + b;
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const lerp = (a, b, t) => a + (b - a) * t;

export function roundRect(x, y, w, h, r, fillStyle, fill = true, strokeStyle) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

export function hit(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function removeFromArray(arr, item) {
  const i = arr.indexOf(item);
  if (i >= 0) arr.splice(i, 1);
}

export function pulse(text, color = "#adf") {
  pulses.push({ text, x: 0, y: 0, life: 1.2, c: color });
}


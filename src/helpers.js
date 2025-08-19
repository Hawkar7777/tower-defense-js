import { ctx } from "./core.js";

export function roundRect(
  x,
  y,
  w,
  h,
  r = 4,
  fillColor = "#000",
  fill = true,
  strokeColor = null
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) (ctx.fillStyle = fillColor), ctx.fill();
  if (strokeColor) (ctx.strokeStyle = strokeColor), ctx.stroke();
}

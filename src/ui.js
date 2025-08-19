import { ctx, TILE } from "./core.js";
import { roundRect, hit, clamp } from "./utils.js";
import { TOWER_TYPES } from "./config.js";
import { state, pulses, enemies, towers } from "./state.js";
import { ui } from "./state.js";
import { pointAt, blocked } from "./path.js";

export function drawBackground(t, pathArr) {
  ctx.fillStyle = "#0b0f1a";
  ctx.fillRect(0, 0, Math.max(0, ctx.canvas.width), Math.max(0, ctx.canvas.height));
  ctx.save();
  const W = ctx.canvas.clientWidth;
  const H = ctx.canvas.clientHeight;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "rgba(0,180,255,0.05)");
  g.addColorStop(1, "rgba(255,0,220,0.05)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += TILE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Neon path
  if (pathArr && pathArr.length) {
    ctx.strokeStyle = "#29e3ff";
    ctx.lineWidth = 10;
    ctx.globalAlpha = 0.15;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pathArr[0].x, pathArr[0].y);
    for (let i = 1; i < pathArr.length; i++) ctx.lineTo(pathArr[i].x, pathArr[i].y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0cf";
    ctx.beginPath();
    ctx.moveTo(pathArr[0].x, pathArr[0].y);
    for (let i = 1; i < pathArr.length; i++) ctx.lineTo(pathArr[i].x, pathArr[i].y);
    ctx.stroke();
  }
}

export function drawTopbar(W) {
  roundRect(
    12,
    12,
    Math.max(200, W - 24),
    64,
    14,
    "rgba(10,20,36,0.85)",
    true,
    "rgba(42,72,116,0.8)"
  );
  ctx.font = "700 22px Inter, system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillStyle = "#bfe7ff";
  ctx.fillText(`Wave ${state.wave}`, 28, 52);
  ctx.fillStyle = "#e6ffb3";
  ctx.fillText(`$ ${state.money}`, 160, 52);
  ctx.fillStyle = state.lives > 5 ? "#b3ffd9" : "#ffc7c7";
  ctx.fillText(`❤ ${state.lives}`, 260, 52);

  for (const p of pulses) {
    p.y -= 20 / 60;
    p.life -= 1 / 60;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.c;
    ctx.fillText(p.text, p.x || W - 120, p.y || 58);
    ctx.globalAlpha = 1;
  }
  for (let i = pulses.length - 1; i >= 0; i--) if (pulses[i].life <= 0) pulses.splice(i, 1);
}

export function getShopButtons(W, H) {
  const pad = 18;
  const y = H - 88;
  const h = 74;
  const w = 170;
  const keys = Object.keys(TOWER_TYPES);
  return keys.map((k, i) => ({ key: k, x: pad + i * (w + 12), y, w, h }));
}

export function drawShop(W, H) {
  const buttons = getShopButtons(W, H);
  for (const b of buttons) {
    const spec = TOWER_TYPES[b.key];
    const active = ui.selectedShopKey === b.key;
    roundRect(
      b.x,
      b.y,
      b.w,
      b.h,
      12,
      active ? "rgba(26,46,76,0.95)" : "rgba(12,22,36,0.9)",
      true,
      active ? "#3d6fb6" : "#24496f"
    );
    ctx.fillStyle = spec.color;
    ctx.font = "700 18px Inter, system-ui";
    ctx.fillText(spec.name, b.x + 16, b.y + 28);
    ctx.fillStyle = "#bfe7ff";
    ctx.font = "500 14px Inter, system-ui";
    ctx.fillText(`$${spec.cost}  •  Rng ${spec.range}`, b.x + 16, b.y + 50);
  }
}

export function drawGhost(hoveredTile, TILE, selectedShopKey) {
  if (!hoveredTile) return;
  const gx = hoveredTile.gx,
    gy = hoveredTile.gy;
  const x = gx * TILE,
    y = gy * TILE;
  const valid = !blocked.has(`${gx},${gy}`);
  const spec = TOWER_TYPES[selectedShopKey];
  const c = { x: x + TILE / 2, y: y + TILE / 2 };
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = valid ? "#9f9" : "#f99";
  ctx.beginPath();
  ctx.arc(c.x, c.y, spec.range, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  roundRect(
    x + 4,
    y + 4,
    TILE - 8,
    TILE - 8,
    10,
    valid ? "rgba(120,220,140,0.35)" : "rgba(255,120,120,0.35)"
  );
}

export function drawInspector(selectedTower) {
  if (!selectedTower) return;
  const t = selectedTower;
  const s = t.spec();
  const c = t.center();
  const panel = {
    x: clamp(c.x - 90, 12, ctx.canvas.clientWidth - 192),
    y: clamp(c.y - 110, 12, ctx.canvas.clientHeight - 210),
    w: 180,
    h: 120,
  };
  roundRect(
    panel.x,
    panel.y,
    panel.w,
    panel.h,
    12,
    "rgba(12,22,36,0.95)",
    true,
    "#2c527f"
  );
  ctx.fillStyle = "#bfe7ff";
  ctx.font = "700 16px Inter";
  ctx.fillText(`${s.name} Lv.${t.level}`, panel.x + 14, panel.y + 28);
  ctx.font = "500 14px Inter";
  ctx.fillText(`Dmg ${Math.round(s.dmg)}  Rng ${Math.round(s.range)}`, panel.x + 14, panel.y + 50);
  ctx.fillText(`Rate ${s.fireRate.toFixed(1)}/s`, panel.x + 14, panel.y + 70);
  ctx.fillText(`U: Upgrade $${t.upgradeCost()}`, panel.x + 14, panel.y + 92);
  ctx.fillText(`S: Sell $${Math.round(t.sellValue())}`, panel.x + 14, panel.y + 110);
}


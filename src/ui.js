import { ctx, TILE } from "./core.js";
import { roundRect, hit, clamp } from "./utils.js";
import { TOWER_TYPES } from "./config.js";
import { state, pulses, enemies, towers } from "./state.js";
import { ui } from "./state.js";
import { pointAt, blocked } from "./path.js";

export function drawBackground(t, pathArr) {
  ctx.fillStyle = "#0b0f1a";
  ctx.fillRect(
    0,
    0,
    Math.max(0, ctx.canvas.width),
    Math.max(0, ctx.canvas.height)
  );
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
    for (let i = 1; i < pathArr.length; i++)
      ctx.lineTo(pathArr[i].x, pathArr[i].y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0cf";
    ctx.beginPath();
    ctx.moveTo(pathArr[0].x, pathArr[0].y);
    for (let i = 1; i < pathArr.length; i++)
      ctx.lineTo(pathArr[i].x, pathArr[i].y);
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
  for (let i = pulses.length - 1; i >= 0; i--)
    if (pulses[i].life <= 0) pulses.splice(i, 1);
}
export function getShopButtons(W, H) {
  const pad = 18;
  const y = H - 88;
  const h = 74;
  const w = 150;
  const keys = Object.keys(TOWER_TYPES);

  // Calculate total width needed
  const totalWidth = keys.length * (w + 12) - 12 + pad * 2;

  // Add scroll offset if needed
  const scrollOffset = ui.shopScrollOffset || 0;

  return keys.map((k, i) => ({
    key: k,
    x: pad + i * (w + 12) - scrollOffset,
    y,
    w,
    h,
  }));
}

export function drawShop(W, H) {
  const buttons = getShopButtons(W, H);
  const keys = Object.keys(TOWER_TYPES);

  // Calculate max scroll needed
  const totalWidth = keys.length * (150 + 12) - 12 + 18 * 2;
  ui.maxShopScroll = Math.max(0, totalWidth - W);

  // Draw scroll indicators if needed
  if (ui.maxShopScroll > 0) {
    // Left scroll indicator
    if (ui.shopScrollOffset > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.moveTo(10, H - 40);
      ctx.lineTo(20, H - 50);
      ctx.lineTo(20, H - 30);
      ctx.closePath();
      ctx.fill();
    }

    // Right scroll indicator
    if (ui.shopScrollOffset < ui.maxShopScroll) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.moveTo(W - 10, H - 40);
      ctx.lineTo(W - 20, H - 50);
      ctx.lineTo(W - 20, H - 30);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Clip the shop area to prevent buttons from drawing outside
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, H - 100, W, 100);
  ctx.clip();

  for (const b of buttons) {
    const spec = TOWER_TYPES[b.key];
    const active = ui.selectedShopKey === b.key;
    const canAfford = state.money >= spec.cost;

    // Apply disabled styling if can't afford
    const bgColor = canAfford
      ? active
        ? "rgba(26,46,76,0.95)"
        : "rgba(12,22,36,0.9)"
      : "rgba(36,36,48,0.8)";

    const borderColor = canAfford
      ? active
        ? "#3d6fb6"
        : "#24496f"
      : "#444455";

    const textColor = canAfford ? spec.color : "#666677";
    const costColor = canAfford ? "#bfe7ff" : "#888899";

    roundRect(b.x, b.y, b.w, b.h, 12, bgColor, true, borderColor);

    ctx.fillStyle = textColor;
    ctx.font = "700 18px Inter, system-ui";
    ctx.fillText(spec.name, b.x + 16, b.y + 28);
    ctx.fillStyle = costColor;
    ctx.font = "500 14px Inter, system-ui";
    ctx.fillText(`$${spec.cost}  •  Rng ${spec.range}`, b.x + 16, b.y + 50);
  }

  ctx.restore(); // Restore clipping
}
export function drawGhost(
  hoveredTile,
  TILE,
  selectedShopKey,
  isDragging = false
) {
  if (!hoveredTile) return;

  const gx = hoveredTile.gx;
  const gy = hoveredTile.gy;
  const x = gx * TILE;
  const y = gy * TILE;

  // Check if placement is valid
  const valid =
    gx >= 0 &&
    gy >= 0 &&
    gy < Math.floor(ctx.canvas.clientHeight / TILE) - 2 &&
    !blocked.has(`${gx},${gy}`) &&
    !towers.some((t) => t.gx === gx && t.gy === gy);

  const spec = TOWER_TYPES[selectedShopKey];
  const c = { x: x + TILE / 2, y: y + TILE / 2 };

  // Draw range circle with higher opacity when dragging
  ctx.globalAlpha = isDragging ? 0.2 : 0.12;
  ctx.fillStyle = valid ? "#9f9" : "#f99";
  ctx.beginPath();
  ctx.arc(c.x, c.y, spec.range, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw ghost tower with higher opacity when dragging
  roundRect(
    x + 4,
    y + 4,
    TILE - 8,
    TILE - 8,
    10,
    valid
      ? isDragging
        ? "rgba(120,220,140,0.6)"
        : "rgba(120,220,140,0.35)"
      : isDragging
      ? "rgba(255,120,120,0.6)"
      : "rgba(255,120,120,0.35)"
  );
}

export function drawInspector(selectedTower) {
  if (!selectedTower) return;
  const t = selectedTower;
  const s = t.spec();
  const c = t.center;
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
  ctx.fillText(
    `Dmg ${Math.round(s.dmg)}  Rng ${Math.round(s.range)}`,
    panel.x + 14,
    panel.y + 50
  );
  ctx.fillText(`Rate ${s.fireRate.toFixed(1)}/s`, panel.x + 14, panel.y + 70);
  ctx.fillText(`U: Upgrade $${t.upgradeCost()}`, panel.x + 14, panel.y + 92);
  ctx.fillText(
    `S: Sell $${Math.round(t.sellValue())}`,
    panel.x + 14,
    panel.y + 110
  );
}

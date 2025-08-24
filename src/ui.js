import { ctx, TILE, MAP_GRID_W, MAP_GRID_H } from "./core.js";
import { roundRect, clamp } from "./utils.js";
import { TOWER_TYPES } from "./config.js";
import { state, pulses, towers } from "./state.js";
import { ui } from "./state.js";
import { blocked } from "./path.js";
// --- NEW IMPORTS ---
import { getOccupiedCells, isPlacementValid } from "./occupation.js";

export function drawBackground(t, pathArr) {
  const W = ctx.canvas.clientWidth;
  const H = ctx.canvas.clientHeight;

  ctx.fillStyle = "#0b0f1a";
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "rgba(0,180,255,0.05)");
  g.addColorStop(1, "rgba(255,0,220,0.05)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function formatMoney(num) {
  if (num < 1000) return num.toString();
  const tiers = [
    { value: 1e12, symbol: "t" },
    { value: 1e9, symbol: "b" },
    { value: 1e6, symbol: "m" },
    { value: 1e3, symbol: "k" },
  ];
  const tier = tiers.find((t) => num >= t.value);
  if (tier) {
    const formatted = (num / tier.value).toFixed(1).replace(/.0$/, "");
    return formatted + tier.symbol;
  }
  return num.toString();
}

export function drawTopbar(W) {
  ctx.font = "700 10px Inter, system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillStyle = "#bfe7ff";
  ctx.fillText(`Wave ${state.wave}`, 15, 20);
  ctx.fillStyle = "#e6ffb3";
  ctx.fillText(`$ ${formatMoney(state.money)}`, 90, 20);
  ctx.fillStyle = state.lives > 5 ? "#b3ffd9" : "#ffc7c7";
  ctx.fillText(`❤ ${state.lives}`, 150, 20);

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
  const y = H - 78;
  const h = 60;
  const w = 140;
  const keys = Object.keys(TOWER_TYPES);

  ui.shopScrollOffset = ui.shopScrollOffset || 0;

  return keys.map((k, i) => ({
    key: k,
    x: pad + i * (w + 12) - ui.shopScrollOffset,
    y,
    w,
    h,
  }));
}

export function drawShop(W, H) {
  const buttons = getShopButtons(W, H);
  const keys = Object.keys(TOWER_TYPES);

  const totalWidth = keys.length * (140 + 12) - 12 + 18 * 2;
  ui.maxShopScroll = Math.max(0, totalWidth - W);
  ui.shopScrollOffset = Math.max(
    0,
    Math.min(ui.maxShopScroll, ui.shopScrollOffset || 0)
  );

  if (ui.maxShopScroll > 0) {
    if (ui.shopScrollOffset > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.moveTo(10, H - 48);
      ctx.lineTo(20, H - 58);
      ctx.lineTo(20, H - 38);
      ctx.closePath();
      ctx.fill();
    }
    if (ui.shopScrollOffset < ui.maxShopScroll) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.moveTo(W - 10, H - 48);
      ctx.lineTo(W - 20, H - 58);
      ctx.lineTo(W - 20, H - 38);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, H - 100, W, 100);
  ctx.clip();

  for (const b of buttons) {
    const spec = TOWER_TYPES[b.key];
    const active = ui.selectedShopKey === b.key;
    const canAfford = state.money >= spec.cost;

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

    roundRect(b.x, b.y, b.w, b.h, 8, bgColor, true, borderColor);

    ctx.fillStyle = textColor;
    ctx.font = "700 16px Inter, system-ui";
    ctx.fillText(spec.name, b.x + 16, b.y + 24);
    ctx.fillStyle = costColor;
    ctx.font = "500 13px Inter, system-ui";
    ctx.fillText(`$${spec.cost}  •  Rng ${spec.range}`, b.x + 16, b.y + 45);
  }

  ctx.restore();
}

export function drawGhost(
  hoveredTile,
  TILEparam,
  selectedShopKey,
  isDragging = false
) {
  if (!hoveredTile || !selectedShopKey) return;

  const gx = hoveredTile.gx;
  const gy = hoveredTile.gy;

  const spec = TOWER_TYPES[selectedShopKey];
  if (!spec) return;

  const valid = isPlacementValid(gx, gy, spec);
  const cells = getOccupiedCells(gx, gy, spec.size);

  const minGx = Math.min(...cells.map((c) => c.gx));
  const maxGx = Math.max(...cells.map((c) => c.gx));
  const minGy = Math.min(...cells.map((c) => c.gy));
  const maxGy = Math.max(...cells.map((c) => c.gy));

  const ghostX = minGx * TILEparam;
  const ghostY = minGy * TILEparam;
  const ghostW = (maxGx - minGx + 1) * TILEparam;
  const ghostH = (maxGy - minGy + 1) * TILEparam;

  const c = { x: (gx + 0.5) * TILEparam, y: (gy + 0.5) * TILEparam };

  ctx.globalAlpha = isDragging ? 0.2 : 0.12;
  ctx.fillStyle = valid ? "#9f9" : "#f99";
  ctx.beginPath();
  ctx.arc(c.x, c.y, spec.range, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  roundRect(
    ghostX + 4,
    ghostY + 4,
    ghostW - 8,
    ghostH - 8,
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

export function drawHeldTowerRange(tower) {
  if (!tower) return;
  const s = tower.spec();

  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(tower.center.x, tower.center.y, s.range, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function drawInspector(selectedTower, camera, zoom) {
  if (!selectedTower) {
    ui.inspectorButtons = null; // Clear buttons when no tower is selected
    return;
  }
  const t = selectedTower;
  const s = t.spec();

  const screenX = (t.center.x - camera.x) * zoom;
  const screenY = (t.center.y - camera.y) * zoom;

  const W = ctx.canvas.clientWidth;
  const H = ctx.canvas.clientHeight;

  const panel = {
    x: clamp(screenX - 90, 12, W - 192),
    y: clamp(screenY - 120, 12, H - 220),
    w: 180,
    h: 130, // Increased height for buttons
  };

  // Store panel and buttons info for click detection
  ui.inspectorButtons = { panel };

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

  ctx.font = "500 13px Inter";
  ctx.fillStyle = "#aaccff";
  ctx.fillText(`Dmg ${Math.round(s.dmg)}`, panel.x + 14, panel.y + 52);
  ctx.fillText(`Rng ${Math.round(s.range)}`, panel.x + 14, panel.y + 70);
  ctx.fillText(`Rate ${s.fireRate.toFixed(1)}/s`, panel.x + 88, panel.y + 70);

  const buttonY = panel.y + 88;
  const buttonH = 32;
  const buttonW = (panel.w - 30) / 2;

  // --- Upgrade Button ---
  if (typeof t.upgradeCost === "function") {
    const upgradeCost = t.upgradeCost();
    const canAfford = state.money >= upgradeCost;

    const upgradeButton = {
      x: panel.x + 10,
      y: buttonY,
      w: buttonW,
      h: buttonH,
    };
    ui.inspectorButtons.upgrade = upgradeButton;

    roundRect(
      upgradeButton.x,
      upgradeButton.y,
      upgradeButton.w,
      upgradeButton.h,
      6,
      canAfford ? "rgba(40, 80, 130, 0.8)" : "rgba(50, 50, 60, 0.7)",
      true,
      canAfford ? "#3d6fb6" : "#555566"
    );

    ctx.fillStyle = canAfford ? "#bfe7ff" : "#888899";
    ctx.textAlign = "center";

    // Draw UP icon
    ctx.beginPath();
    ctx.moveTo(upgradeButton.x + upgradeButton.w / 2, upgradeButton.y + 8);
    ctx.lineTo(upgradeButton.x + upgradeButton.w / 2 - 5, upgradeButton.y + 14);
    ctx.lineTo(upgradeButton.x + upgradeButton.w / 2 + 5, upgradeButton.y + 14);
    ctx.closePath();
    ctx.fill();

    ctx.font = "600 12px Inter";
    ctx.fillText(
      `$${formatMoney(upgradeCost)}`,
      upgradeButton.x + upgradeButton.w / 2,
      upgradeButton.y + 26
    );
    ctx.textAlign = "start"; // Reset alignment
  }

  // --- Sell Button ---
  if (typeof t.sellValue === "function") {
    const sellValue = Math.round(t.sellValue());
    const sellButton = {
      x: panel.x + 20 + buttonW,
      y: buttonY,
      w: buttonW,
      h: buttonH,
    };
    ui.inspectorButtons.sell = sellButton;

    roundRect(
      sellButton.x,
      sellButton.y,
      sellButton.w,
      sellButton.h,
      6,
      "rgba(130, 40, 60, 0.8)",
      true,
      "#b63d56"
    );

    ctx.fillStyle = "#ffdde5";
    ctx.textAlign = "center";

    // Draw DOLLAR icon
    ctx.font = "700 14px Inter";
    ctx.fillText(`$`, sellButton.x + sellButton.w / 2, sellButton.y + 15);

    ctx.font = "600 12px Inter";
    ctx.fillText(
      `${formatMoney(sellValue)}`,
      sellButton.x + sellButton.w / 2,
      sellButton.y + 28
    );
    ctx.textAlign = "start"; // Reset alignment
  }
}

export function drawPlacementOverlay() {
  if (!ui.selectedShopKey) {
    return;
  }

  const allOccupiedCells = new Set();
  for (const tower of towers) {
    const spec = TOWER_TYPES[tower.key];
    if (!spec) continue;
    const cells = getOccupiedCells(tower.gx, tower.gy, spec.size);
    for (const cell of cells) {
      allOccupiedCells.add(`${cell.gx},${cell.gy}`);
    }
  }

  for (let gy = 0; gy < MAP_GRID_H; gy++) {
    for (let gx = 0; gx < MAP_GRID_W; gx++) {
      const isInvalid =
        gy >= MAP_GRID_H - 2 ||
        blocked.has(`${gx},${gy}`) ||
        allOccupiedCells.has(`${gx},${gy}`);

      if (isInvalid) {
        ctx.fillStyle = "rgba(255, 100, 100, 0.4)";
        ctx.fillRect(gx * TILE, gy * TILE, TILE, TILE);
      }
    }
  }
}

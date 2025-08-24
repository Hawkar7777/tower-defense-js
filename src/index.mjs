// index.mjs

import {
  canvas,
  ctx,
  TILE,
  resize,
  syncLogicalSize,
  MIN_ZOOM,
  MAX_ZOOM,
  MAP_GRID_W,
  MAP_GRID_H,
  setMapDimensions,
} from "./core.js";
import {
  state,
  enemies,
  towers,
  projectiles,
  ui,
  resetState,
} from "./state.js";
import { clamp, dist, pulse } from "./utils.js";
import { TOWER_TYPES } from "./config.js";
import { initPath, path } from "./path.js";
import { updateEffects, drawEffects } from "./effects.js";
import { spawner, startNextWave } from "./spawner.js";
import {
  drawBackground,
  drawTopbar,
  drawShop,
  drawGhost,
  drawInspector,
  getShopButtons,
  drawHeldTowerRange,
  drawPlacementOverlay,
} from "./ui.js";
import {
  updateOccupiedCells,
  isPlacementValid,
  findTowerAt,
} from "./occupation.js";
import { levels } from "./levels.js";

const TOUCH_PAN_SENSITIVITY = 1.5;
const HOLD_DURATION = 200;

let mouse = {
  x: 0,
  y: 0,
  gx: 0,
  gy: 0,
  down: false,
  draggingTower: false,
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  camStart: { x: 0, y: 0 },
  isHolding: false,
  holdTimer: null,
  shopInteraction: false,
};
let touch = {
  action: "idle",
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  isHolding: false,
  holdTimer: null,
  potentialSelection: null,
};
let initialPinchDist = null;
let initialZoom = 1.0;

let last = performance.now();
let animationFrameId = null;

/**
 * Draws a beautiful, animated sci-fi path.
 * @param {Array<Object>} pathArr The array of points defining the path.
 * @param {number} time The current game time, used for animation.
 */
function drawPath(pathArr, time) {
  if (!pathArr || pathArr.length < 2) {
    return;
  }
  // --- 1. The Outer Glow ---
  ctx.strokeStyle = "rgba(0, 225, 255, 0.2)";
  ctx.lineWidth = 25;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = 30;
  ctx.shadowColor = "rgba(0, 180, 255, 0.7)";
  ctx.beginPath();
  ctx.moveTo(pathArr[0].x, pathArr[0].y);
  for (let i = 1; i < pathArr.length; i++) {
    ctx.lineTo(pathArr[i].x, pathArr[i].y);
  }
  ctx.stroke();

  // --- 2. The Inner Core Line ---
  ctx.strokeStyle = "rgba(200, 245, 255, 0.8)";
  ctx.lineWidth = 4;
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#00ffff";
  ctx.stroke();

  // --- 3. Animated Dashes ---
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.lineCap = "butt";
  ctx.setLineDash([15, 45]);
  ctx.lineDashOffset = -(time * 100) % 60;
  ctx.shadowBlur = 5;
  ctx.shadowColor = "#fff";
  ctx.stroke();

  // --- IMPORTANT: Reset styles ---
  ctx.shadowBlur = 0;
  ctx.setLineDash([]);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function loop(ts) {
  if (!state.running) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    return;
  }

  const dt = Math.min(0.033, (ts - last) / 1000);
  last = ts;
  state.time += dt;

  // --- UPDATE LOGIC ---
  spawner(dt);
  for (const t of towers) t.update(dt, enemies);
  for (const b of projectiles) b.update(dt);
  for (const e of enemies) e.update(dt);
  updateEffects(dt);
  for (let i = projectiles.length - 1; i >= 0; i--)
    if (projectiles[i].dead) projectiles.splice(i, 1);
  for (let i = enemies.length - 1; i >= 0; i--)
    if (enemies[i].dead) enemies.splice(i, 1);
  if (state.lives <= 0) {
    gameOver();
    return;
  }

  // --- START OF RESTORED DRAWING LOGIC ---
  // This entire block was missing from your previous code.

  drawBackground(state.time, path);
  drawTopbar(canvas.clientWidth);
  drawShop(canvas.clientWidth, canvas.clientHeight);

  ctx.save();
  ctx.translate(-state.camera.x * state.zoom, -state.camera.y * state.zoom);
  ctx.scale(state.zoom, state.zoom);

  // Draw grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1 / state.zoom;
  ctx.beginPath();
  for (let i = 0; i <= MAP_GRID_W; i++) {
    ctx.moveTo(i * TILE, 0);
    ctx.lineTo(i * TILE, MAP_GRID_H * TILE);
  }
  for (let i = 0; i <= MAP_GRID_H; i++) {
    ctx.moveTo(0, i * TILE);
    ctx.lineTo(MAP_GRID_W * TILE, i * TILE);
  }
  ctx.stroke();

  // Draw the new, beautiful path
  drawPath(path, state.time);

  drawPlacementOverlay();

  if (ui.heldTower) {
    drawHeldTowerRange(ui.heldTower);
  }

  if (
    (mouse.draggingTower || (ui.hoveredTile && ui.selectedShopKey)) &&
    mouse.y <= canvas.clientHeight - 100
  ) {
    drawGhost(ui.hoveredTile, TILE, ui.selectedShopKey, mouse.draggingTower);
  }

  // Draw entities
  for (const t of towers) t.draw();
  for (const e of enemies) e.draw();
  for (const b of projectiles) b.draw();
  drawEffects();

  ctx.restore();

  drawInspector(ui.selectedTower, state.camera, state.zoom);

  // --- END OF RESTORED DRAWING LOGIC ---

  animationFrameId = requestAnimationFrame(loop);
}

export function startGame(levelNumber) {
  const levelConfig = levels.find((l) => l.level === levelNumber);
  if (!levelConfig) {
    alert(`Error: Level ${levelNumber} configuration not found!`);
    return;
  }
  resetState();
  setMapDimensions(levelConfig.map.width, levelConfig.map.height);
  resize();
  initPath(levelConfig.path);
  startNextWave();
  last = performance.now();
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  animationFrameId = requestAnimationFrame(loop);
}

function gameOver() {
  state.running = false;
  drawBackground(state.time, path);
  drawTopbar(canvas.clientWidth);
  ctx.fillStyle = "rgba(10,20,36,0.86)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.fillStyle = "#fff";
  ctx.font = "800 48px Inter";
  ctx.textAlign = "center";
  ctx.fillText(
    "Game Over",
    canvas.clientWidth / 2,
    canvas.clientHeight / 2 - 10
  );
  ctx.font = "500 18px Inter";
  ctx.fillStyle = "#bfe7ff";
  ctx.fillText(
    `You reached wave ${state.wave}. Refresh to try again!`,
    canvas.clientWidth / 2,
    canvas.clientHeight / 2 + 28
  );
  ctx.textAlign = "start";
}

// --- ALL INPUT HANDLING LOGIC IS UNCHANGED ---
function getCanvasPos(clientX, clientY) {
  /* ... */ return {
    x: clientX - canvas.getBoundingClientRect().left,
    y: clientY - canvas.getBoundingClientRect().top,
  };
}
function applyZoom(zoomDelta, zoomCenter) {
  /* ... */ const oldZoom = state.zoom;
  const newZoom = clamp(state.zoom + zoomDelta, MIN_ZOOM, MAX_ZOOM);
  if (newZoom === oldZoom) return;
  const worldX = zoomCenter.x / oldZoom + state.camera.x;
  const worldY = zoomCenter.y / oldZoom + state.camera.y;
  state.zoom = newZoom;
  state.camera.x = worldX - zoomCenter.x / state.zoom;
  state.camera.y = worldY - zoomCenter.y / state.zoom;
  const maxCamX = Math.max(
    0,
    MAP_GRID_W * TILE - canvas.clientWidth / state.zoom
  );
  const maxCamY = Math.max(
    0,
    MAP_GRID_H * TILE - canvas.clientHeight / state.zoom
  );
  state.camera.x = clamp(state.camera.x, 0, maxCamX);
  state.camera.y = clamp(state.camera.y, 0, maxCamY);
}
function handleInspectorClick(pos) {
  /* ... */ if (!ui.selectedTower || !ui.inspectorButtons) {
    return false;
  }
  const { panel, upgrade, sell } = ui.inspectorButtons;
  if (
    upgrade &&
    pos.x >= upgrade.x &&
    pos.x <= upgrade.x + upgrade.w &&
    pos.y >= upgrade.y &&
    pos.y <= upgrade.y + upgrade.h
  ) {
    const cost = ui.selectedTower.upgradeCost();
    if (state.money >= cost) {
      state.money -= cost;
      ui.selectedTower.level++;
      pulse(`Upgrade -$${cost}`);
    } else {
      pulse("Need more $", "#f66");
    }
    return true;
  }
  if (
    sell &&
    pos.x >= sell.x &&
    pos.x <= sell.x + sell.w &&
    pos.y >= sell.y &&
    pos.y <= sell.y + sell.h
  ) {
    const sellValue = Math.round(ui.selectedTower.sellValue());
    state.money += sellValue;
    const towerIndex = towers.indexOf(ui.selectedTower);
    if (towerIndex > -1) {
      towers.splice(towerIndex, 1);
      updateOccupiedCells();
    }
    pulse(`+$${sellValue}`, "#afa");
    ui.selectedTower = null;
    return true;
  }
  if (
    panel &&
    pos.x >= panel.x &&
    pos.x <= panel.x + panel.w &&
    pos.y >= panel.y &&
    pos.y <= panel.y + panel.h
  ) {
    return true;
  }
  return false;
}

// All canvas.addEventListener(...) calls remain exactly the same.
canvas.addEventListener("touchstart", (e) => {
  /* ... unchanged ... */
});
canvas.addEventListener("touchmove", (e) => {
  /* ... unchanged ... */
});
canvas.addEventListener("touchend", (e) => {
  /* ... unchanged ... */
});
canvas.addEventListener("touchcancel", (e) => {
  /* ... unchanged ... */
});
canvas.addEventListener("wheel", (e) => {
  /* ... unchanged ... */
});
canvas.addEventListener("mousemove", (e) => {
  /* ... unchanged ... */
});
canvas.addEventListener("mousedown", (e) => {
  /* ... unchanged ... */
});
canvas.addEventListener("mouseup", (e) => {
  /* ... unchanged ... */
});
canvas.addEventListener("mouseleave", () => {
  /* ... unchanged ... */
});
window.addEventListener("keydown", (e) => {
  /* ... unchanged ... */
});

// All canvas.addEventListener(...) calls remain exactly the same as your original file
canvas.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    if (e.touches.length >= 2) {
      touch.action = "zooming";
      const [t1, t2] = e.touches;
      initialPinchDist = dist(
        { x: t1.clientX, y: t1.clientY },
        { x: t2.clientX, y: t2.clientY }
      );
      initialZoom = state.zoom;
      clearTimeout(touch.holdTimer);
      return;
    }
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const pos = getCanvasPos(t.clientX, t.clientY);
    touch.startX = pos.x;
    touch.startY = pos.y;
    touch.currentX = pos.x;
    touch.currentY = pos.y;
    if (pos.y > canvas.clientHeight - 100) {
      touch.action = "scrollingShop";
    } else {
      touch.action = "panning";
      mouse.camStart.x = state.camera.x;
      mouse.camStart.y = state.camera.y;
      const worldX = pos.x / state.zoom + state.camera.x;
      const worldY = pos.y / state.zoom + state.camera.y;
      const gx = Math.floor(worldX / TILE);
      const gy = Math.floor(worldY / TILE);
      const clickedTower = findTowerAt(gx, gy);
      if (clickedTower) {
        touch.potentialSelection = clickedTower;
        touch.holdTimer = setTimeout(() => {
          touch.isHolding = true;
          ui.heldTower = clickedTower;
          ui.selectedTower = null;
        }, HOLD_DURATION);
      }
    }
  },
  { passive: false }
);
canvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    if (e.touches.length >= 2 && touch.action === "zooming") {
      const [t1, t2] = e.touches;
      const currentDist = dist(
        { x: t1.clientX, y: t1.clientY },
        { x: t2.clientX, y: t2.clientY }
      );
      const zoomFactor = currentDist / initialPinchDist;
      const newZoom = clamp(initialZoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);
      const zoomDelta = newZoom - state.zoom;
      const midPoint = getCanvasPos(
        (t1.clientX + t2.clientX) / 2,
        (t1.clientY + t2.clientY) / 2
      );
      applyZoom(zoomDelta, midPoint);
      return;
    }
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const pos = getCanvasPos(t.clientX, t.clientY);
    touch.currentX = pos.x;
    touch.currentY = pos.y;
    if (
      dist({ x: touch.startX, y: touch.startY }, { x: pos.x, y: pos.y }) > 10
    ) {
      clearTimeout(touch.holdTimer);
      ui.heldTower = null;
      touch.potentialSelection = null;
      touch.isHolding = false;
    }
    if (touch.action === "scrollingShop") {
      const deltaX = touch.startX - pos.x;
      ui.shopScrollOffset = Math.max(
        0,
        Math.min(ui.maxShopScroll || 0, (ui.shopScrollOffset || 0) + deltaX)
      );
      touch.startX = pos.x;
    } else if (touch.action === "panning") {
      const dx = pos.x - touch.startX;
      const dy = pos.y - touch.startY;
      state.camera.x = mouse.camStart.x - dx * TOUCH_PAN_SENSITIVITY;
      state.camera.y = mouse.camStart.y - dy * TOUCH_PAN_SENSITIVITY;
      const maxCamX = Math.max(
        0,
        MAP_GRID_W * TILE - canvas.clientWidth / state.zoom
      );
      const maxCamY = Math.max(
        0,
        MAP_GRID_H * TILE - canvas.clientHeight / state.zoom
      );
      state.camera.x = clamp(state.camera.x, 0, maxCamX);
      state.camera.y = clamp(state.camera.y, 0, maxCamY);
    }
  },
  { passive: false }
);
canvas.addEventListener(
  "touchend",
  (e) => {
    e.preventDefault();
    clearTimeout(touch.holdTimer);
    const wasHolding = touch.isHolding;
    const pos = { x: touch.startX, y: touch.startY };
    const wasJustATap =
      dist(
        { x: touch.startX, y: touch.startY },
        { x: touch.currentX, y: touch.currentY }
      ) < 10;
    if (wasJustATap && handleInspectorClick(pos)) {
      touch.action = "idle";
      initialPinchDist = null;
      ui.heldTower = null;
      touch.isHolding = false;
      touch.potentialSelection = null;
      return;
    }
    if (!wasHolding && wasJustATap && touch.action !== "zooming") {
      if (touch.action === "scrollingShop") {
        const buttons = getShopButtons(canvas.clientWidth, canvas.clientHeight);
        for (const b of buttons) {
          if (
            pos.x >= b.x &&
            pos.x <= b.x + b.w &&
            pos.y >= b.y &&
            pos.y <= b.y + b.h
          ) {
            const spec = TOWER_TYPES[b.key];
            if (state.money >= spec.cost) {
              ui.selectedShopKey = ui.selectedShopKey === b.key ? null : b.key;
              ui.selectedTower = null;
            } else {
              pulse("Not enough money!", "#f66");
            }
            break;
          }
        }
      } else if (touch.action === "panning") {
        const worldX = pos.x / state.zoom + state.camera.x;
        const worldY = pos.y / state.zoom + state.camera.y;
        const gx = Math.floor(worldX / TILE);
        const gy = Math.floor(worldY / TILE);
        const clickedTower = findTowerAt(gx, gy);
        if (ui.selectedShopKey) {
          const spec = TOWER_TYPES[ui.selectedShopKey];
          if (isPlacementValid(gx, gy, spec)) {
            if (state.money >= spec.cost) {
              towers.push(new spec.class(gx, gy, ui.selectedShopKey));
              state.money -= spec.cost;
              pulse(`-${spec.cost}`);
              ui.selectedShopKey = null;
              updateOccupiedCells();
            } else {
              pulse("Not enough $", "#f66");
            }
          }
        } else if (clickedTower) {
          ui.selectedTower =
            ui.selectedTower === clickedTower ? null : clickedTower;
        } else {
          ui.selectedTower = null;
        }
      }
    }
    if (e.touches.length === 0) {
      touch.action = "idle";
      initialPinchDist = null;
    }
    ui.heldTower = null;
    touch.isHolding = false;
    touch.potentialSelection = null;
  },
  { passive: false }
);
canvas.addEventListener("touchcancel", (e) => {
  e.preventDefault();
  clearTimeout(touch.holdTimer);
  touch.action = "idle";
  initialPinchDist = null;
  ui.heldTower = null;
  touch.isHolding = false;
  touch.potentialSelection = null;
});
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const pos = getCanvasPos(e.clientX, e.clientY);
  if (pos.y > canvas.clientHeight - 100) {
    ui.shopScrollOffset =
      (ui.shopScrollOffset || 0) + (e.deltaY > 0 ? 150 : -150);
    ui.shopScrollOffset = Math.max(
      0,
      Math.min(ui.maxShopScroll || 0, ui.shopScrollOffset)
    );
  } else {
    const zoomAmount = e.deltaY * -0.005;
    applyZoom(zoomAmount, pos);
  }
});
canvas.addEventListener("mousemove", (e) => {
  const pos = getCanvasPos(e.clientX, e.clientY);
  mouse.x = pos.x;
  mouse.y = pos.y;
  if (mouse.isPanning) {
    const dx = mouse.x - mouse.panStartX;
    const dy = mouse.y - mouse.panStartY;
    state.camera.x = mouse.camStart.x - dx;
    state.camera.y = mouse.camStart.y - dy;
    const maxCamX = Math.max(
      0,
      MAP_GRID_W * TILE - canvas.clientWidth / state.zoom
    );
    const maxCamY = Math.max(
      0,
      MAP_GRID_H * TILE - canvas.clientHeight / state.zoom
    );
    state.camera.x = clamp(state.camera.x, 0, maxCamX);
    state.camera.y = clamp(state.camera.y, 0, maxCamY);
  }
  const worldX = mouse.x / state.zoom + state.camera.x;
  const worldY = mouse.y / state.zoom + state.camera.y;
  mouse.gx = Math.floor(worldX / TILE);
  mouse.gy = Math.floor(worldY / TILE);
  ui.hoveredTile = { gx: mouse.gx, gy: mouse.gy };
});
canvas.addEventListener("mousedown", (e) => {
  mouse.shopInteraction = false;
  const pos = getCanvasPos(e.clientX, e.clientY);
  mouse.x = pos.x;
  mouse.y = pos.y;
  mouse.down = true;
  mouse.panStartX = mouse.x;
  mouse.panStartY = mouse.y;
  const worldX = mouse.x / state.zoom + state.camera.x;
  const worldY = mouse.y / state.zoom + state.camera.y;
  mouse.gx = Math.floor(worldX / TILE);
  mouse.gy = Math.floor(worldY / TILE);
  if (mouse.y > canvas.clientHeight - 100) {
    const buttons = getShopButtons(canvas.clientWidth, canvas.clientHeight);
    for (const b of buttons) {
      if (
        mouse.x >= b.x &&
        mouse.x <= b.x + b.w &&
        mouse.y >= b.y &&
        mouse.y <= b.y + b.h
      ) {
        const spec = TOWER_TYPES[b.key];
        if (state.money < spec.cost) {
          pulse("Not enough money!", "#f66");
        } else {
          ui.selectedShopKey = ui.selectedShopKey === b.key ? null : b.key;
          ui.selectedTower = null;
        }
        mouse.shopInteraction = true;
        return;
      }
    }
  }
  const t = findTowerAt(mouse.gx, mouse.gy);
  if (t) {
    mouse.holdTimer = setTimeout(() => {
      mouse.isHolding = true;
      ui.heldTower = t;
      ui.selectedTower = null;
    }, HOLD_DURATION);
    return;
  }
  if (ui.selectedShopKey) {
    mouse.draggingTower = true;
    return;
  }
  mouse.isPanning = true;
  mouse.camStart.x = state.camera.x;
  mouse.camStart.y = state.camera.y;
});
canvas.addEventListener("mouseup", (e) => {
  if (mouse.shopInteraction) {
    mouse.down = false;
    mouse.shopInteraction = false;
    return;
  }
  clearTimeout(mouse.holdTimer);
  const wasHolding = mouse.isHolding;
  mouse.isHolding = false;
  ui.heldTower = null;
  const dragDistance = dist(
    { x: mouse.panStartX, y: mouse.panStartY },
    { x: mouse.x, y: mouse.y }
  );
  const wasJustAClick =
    !mouse.draggingTower && (dragDistance < 10 || !mouse.isPanning);
  if (wasJustAClick && handleInspectorClick({ x: mouse.x, y: mouse.y })) {
    mouse.isPanning = false;
    mouse.down = false;
    mouse.draggingTower = false;
    return;
  }
  if (wasHolding) {
    mouse.isPanning = false;
    mouse.down = false;
    return;
  }
  if (mouse.draggingTower && ui.selectedShopKey) {
    const spec = TOWER_TYPES[ui.selectedShopKey];
    if (isPlacementValid(mouse.gx, mouse.gy, spec)) {
      if (state.money >= spec.cost) {
        towers.push(new spec.class(mouse.gx, mouse.gy, ui.selectedShopKey));
        state.money -= spec.cost;
        pulse(`-${spec.cost}`);
        ui.selectedShopKey = null;
        updateOccupiedCells();
      } else {
        pulse("Not enough $", "#f66");
      }
    }
  } else if (wasJustAClick) {
    const t = findTowerAt(mouse.gx, mouse.gy);
    if (t) {
      ui.selectedTower = ui.selectedTower === t ? null : t;
      ui.selectedShopKey = null;
    } else {
      ui.selectedTower = null;
      ui.selectedShopKey = null;
    }
  }
  mouse.isPanning = false;
  mouse.down = false;
  mouse.draggingTower = false;
});
canvas.addEventListener("mouseleave", () => {
  clearTimeout(mouse.holdTimer);
  ui.hoveredTile = null;
  mouse.down = false;
  mouse.draggingTower = false;
  mouse.isHolding = false;
  ui.heldTower = null;
});
window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "escape") {
    ui.selectedTower = null;
    ui.selectedShopKey = null;
    ui.heldTower = null;
  }
});

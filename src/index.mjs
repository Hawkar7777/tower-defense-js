// index.mjs

import {
  canvas,
  ctx,
  TILE,
  resize,
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

// --- GLOBAL STATE FOR THE CURRENT LEVEL ---
let currentLevelConfig = null;

const TOUCH_PAN_SENSITIVITY = 1.5;
const HOLD_DURATION = 200;

// --- State objects for input ---
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
  isHolding: false, // True for ANY active drag (from map or shop)
  holdTimer: null,
  potentialSelection: null, // Holds object/key being held over
};

let initialPinchDist = null;
let initialZoom = 1.0;

// --- GAME LOOP CONTROL ---
let last = performance.now();
let animationFrameId = null;

/**
 * The main game loop. Only runs when state.running is true.
 */
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

  // --- WIN/LOSS CHECKS ---
  if (state.lives <= 0) {
    gameOver();
    return;
  }
  if (state.wave > currentLevelConfig.maxWaves && enemies.length === 0) {
    levelComplete();
    return;
  }

  // --- DRAWING LOGIC ---
  drawBackground(state.time, path);
  drawTopbar(canvas.clientWidth);
  drawShop(canvas.clientWidth, canvas.clientHeight);

  ctx.save();
  ctx.translate(-state.camera.x * state.zoom, -state.camera.y * state.zoom);
  ctx.scale(state.zoom, state.zoom);

  // Draw grid and path...
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
  if (path && path.length) {
    ctx.strokeStyle = "#29e3ff";
    ctx.lineWidth = 10;
    ctx.globalAlpha = 0.15;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0cf";
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
  }

  // --- MODIFIED: Ghost Drawing Logic ---
  drawPlacementOverlay();
  if (ui.heldTower) drawHeldTowerRange(ui.heldTower);

  const pointerY = touch.action !== "idle" ? touch.currentY : mouse.y;
  const isDraggingNewTowerFromShop =
    mouse.draggingTower || (touch.isHolding && !!ui.selectedShopKey);

  if (
    (isDraggingNewTowerFromShop || (ui.hoveredTile && ui.selectedShopKey)) &&
    pointerY <= canvas.clientHeight - 100
  ) {
    drawGhost(
      ui.hoveredTile,
      TILE,
      ui.selectedShopKey,
      isDraggingNewTowerFromShop
    );
  }

  // Draw game entities
  for (const t of towers) t.draw();
  for (const e of enemies) e.draw();
  for (const b of projectiles) b.draw();
  drawEffects();

  ctx.restore();
  drawInspector(ui.selectedTower, state.camera, state.zoom);

  animationFrameId = requestAnimationFrame(loop);
}

/**
 * Public function to initialize and start a specific level.
 */
export function startGame(levelNumber) {
  currentLevelConfig = levels.find((l) => l.level === levelNumber);
  if (!currentLevelConfig) {
    alert(`Error: Level ${levelNumber} configuration not found!`);
    return;
  }
  resetState(currentLevelConfig);
  setMapDimensions(currentLevelConfig.map.width, currentLevelConfig.map.height);
  resize();
  initPath(currentLevelConfig.path);
  startNextWave(currentLevelConfig.maxWaves);
  last = performance.now();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
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
    `You reached wave ${state.wave}. Tap or click to return.`,
    canvas.clientWidth / 2,
    canvas.clientHeight / 2 + 28
  );
  ctx.textAlign = "start";
  const reload = () => window.location.reload();
  canvas.addEventListener("click", reload, { once: true });
  canvas.addEventListener("touchend", reload, { once: true });
}

function levelComplete() {
  state.running = false;
  const unlocked = parseInt(
    localStorage.getItem("towerDefenseHighestLevel") || "1"
  );
  if (currentLevelConfig.level >= unlocked) {
    localStorage.setItem(
      "towerDefenseHighestLevel",
      currentLevelConfig.level + 1
    );
  }
  drawBackground(state.time, path);
  drawTopbar(canvas.clientWidth);
  ctx.fillStyle = "rgba(10, 36, 20, 0.86)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.fillStyle = "#fff";
  ctx.font = "800 48px Inter";
  ctx.textAlign = "center";
  ctx.fillText(
    "Victory!",
    canvas.clientWidth / 2,
    canvas.clientHeight / 2 - 10
  );
  ctx.font = "500 18px Inter";
  ctx.fillStyle = "#bfe7ff";
  ctx.fillText(
    `Level ${currentLevelConfig.level} complete! Tap or click to continue.`,
    canvas.clientWidth / 2,
    canvas.clientHeight / 2 + 28
  );
  ctx.textAlign = "start";
  const reload = () => window.location.reload();
  canvas.addEventListener("click", reload, { once: true });
  canvas.addEventListener("touchend", reload, { once: true });
}

// --- INPUT HANDLING ---
function getCanvasPos(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function applyZoom(zoomDelta, zoomCenter) {
  const oldZoom = state.zoom;
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
  if (!ui.selectedTower || !ui.inspectorButtons) return false;
  const { upgrade, sell } = ui.inspectorButtons;
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
    if (towerIndex > -1) towers.splice(towerIndex, 1);
    updateOccupiedCells();
    pulse(`+$${sellValue}`, "#afa");
    ui.selectedTower = null;
    return true;
  }
  return false;
}
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
    applyZoom(e.deltaY * -0.005, pos);
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
    return;
  }
  const worldX = mouse.x / state.zoom + state.camera.x;
  const worldY = mouse.y / state.zoom + state.camera.y;
  mouse.gx = Math.floor(worldX / TILE);
  mouse.gy = Math.floor(worldY / TILE);
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
  if (e.key === "Escape") {
    ui.selectedTower = null;
    ui.selectedShopKey = null;
    ui.heldTower = null;
  }
});

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
      // Interaction is in the SHOP area
      touch.action = "scrollingShop";
      const button = getShopButtons(
        canvas.clientWidth,
        canvas.clientHeight
      ).find(
        (b) =>
          pos.x >= b.x &&
          pos.x <= b.x + b.w &&
          pos.y >= b.y &&
          pos.y <= b.y + b.h
      );
      if (button) {
        const spec = TOWER_TYPES[button.key];
        if (state.money >= spec.cost) {
          touch.potentialSelection = button.key;
          touch.holdTimer = setTimeout(() => {
            touch.isHolding = true;
            ui.selectedShopKey = button.key;
            ui.selectedTower = null;
            touch.potentialSelection = null;
          }, HOLD_DURATION);
        } else {
          pulse("Not enough money!", "#f66");
        }
      }
    } else {
      // Interaction is on the MAP area
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
      applyZoom(
        newZoom - state.zoom,
        getCanvasPos(
          (t1.clientX + t2.clientX) / 2,
          (t1.clientY + t2.clientY) / 2
        )
      );
      return;
    }
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const pos = getCanvasPos(t.clientX, t.clientY);
    touch.currentX = pos.x;
    touch.currentY = pos.y;

    const worldX = pos.x / state.zoom + state.camera.x;
    const worldY = pos.y / state.zoom + state.camera.y;
    ui.hoveredTile = {
      gx: Math.floor(worldX / TILE),
      gy: Math.floor(worldY / TILE),
    };

    if (dist({ x: touch.startX, y: touch.startY }, pos) > 10) {
      clearTimeout(touch.holdTimer);
      if (!touch.isHolding) {
        touch.potentialSelection = null;
        ui.heldTower = null;
      }
    }

    if (!touch.isHolding) {
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
    const wasJustATap =
      dist(
        { x: touch.startX, y: touch.startY },
        { x: touch.currentX, y: touch.currentY }
      ) < 10;

    if (wasHolding && ui.selectedShopKey) {
      // A drag-and-drop from the SHOP ended
      const gx = ui.hoveredTile ? ui.hoveredTile.gx : -1;
      const gy = ui.hoveredTile ? ui.hoveredTile.gy : -1;
      if (touch.currentY < canvas.clientHeight - 100) {
        const spec = TOWER_TYPES[ui.selectedShopKey];
        if (isPlacementValid(gx, gy, spec)) {
          towers.push(new spec.class(gx, gy, ui.selectedShopKey));
          state.money -= spec.cost;
          pulse(`-${spec.cost}`);
          updateOccupiedCells();
        }
      }
      ui.selectedShopKey = null; // Deselect from shop after drop
    } else if (!wasHolding && wasJustATap) {
      // It was a TAP, not a drag
      if (handleInspectorClick({ x: touch.startX, y: touch.startY })) {
        // Action was handled by inspector, do nothing else
      } else if (touch.action === "scrollingShop" && touch.potentialSelection) {
        // Tap in the shop
        ui.selectedShopKey =
          ui.selectedShopKey === touch.potentialSelection
            ? null
            : touch.potentialSelection;
        ui.selectedTower = null;
      } else if (touch.action === "panning") {
        // Tap on the map
        const worldX = touch.startX / state.zoom + state.camera.x;
        const worldY = touch.startY / state.zoom + state.camera.y;
        const gx = Math.floor(worldX / TILE);
        const gy = Math.floor(worldY / TILE);
        const clickedTower = findTowerAt(gx, gy);

        if (ui.selectedShopKey) {
          // Place a tower
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
          // Select an existing tower
          ui.selectedTower =
            ui.selectedTower === clickedTower ? null : clickedTower;
        } else {
          // Deselect everything
          ui.selectedTower = null;
        }
      }
    }

    // Universal Reset Logic
    if (e.touches.length === 0) touch.action = "idle";
    ui.heldTower = null;
    touch.isHolding = false;
    touch.potentialSelection = null;
    initialPinchDist = null;
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
  ui.selectedShopKey = null;
});

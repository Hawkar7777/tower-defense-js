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
  getOccupiedCells,
} from "./occupation.js";
import { levels } from "./levels.js";
import { loadMap, drawMap } from "./map/mapRenderer.js";

// Import the sound manager
import { soundManager } from "./assets/sounds/SoundManager.js"; // Corrected path based on tower imports

// --- GLOBAL STATE ---
let currentLevelConfig = null;
let currentLoadedMapData = null; // Store the loaded map data

// --- OPTIMIZATION: Off-screen canvases for static background elements ---
const gridCanvas = document.createElement("canvas");
const gridCtx = gridCanvas.getContext("2d");
const pathCanvas = document.createElement("canvas");
const pathCtx = pathCanvas.getContext("2d");

// --- MODIFICATION START ---
// Added a new off-screen canvas specifically for disruptor auras
const auraCanvas = document.createElement("canvas");
const auraCtx = auraCanvas.getContext("2d");
// --- MODIFICATION END ---

// --- CONSTANTS ---
const TOUCH_PAN_SENSITIVITY = 1.5;
const HOLD_DURATION = 200;

// --- INPUT STATE (Restored from original for full functionality) ---
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

// --- Player Data (to persist tower levels, if desired) ---
window.playerData = {
  towerLevels: {
    gunnerTower: 1,
    cannonTower: 1,
    doubleCannonTower: 1,
    // Add other tower types here with their initial levels
  },
  // You can expand this to include money, lives, unlocked levels, etc.
};

/**
 * OPTIMIZATION: Pre-renders the static grid to an off-screen canvas.
 * This now uses the MAP_GRID_W and MAP_GRID_H from the loaded map.
 */
function precomputeGrid() {
  gridCanvas.width = MAP_GRID_W * TILE;
  gridCanvas.height = MAP_GRID_H * TILE;
  gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height); // Clear previous grid
  gridCtx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  gridCtx.lineWidth = 1;
  gridCtx.beginPath();
  for (let i = 0; i <= MAP_GRID_W; i++) {
    gridCtx.moveTo(i * TILE, 0);
    gridCtx.lineTo(i * TILE, MAP_GRID_H * TILE);
  }
  for (let i = 0; i <= MAP_GRID_H; i++) {
    gridCtx.moveTo(0, i * TILE);
    gridCtx.lineTo(MAP_GRID_W * TILE, i * TILE);
  }
  gridCtx.stroke();
}

/**
 * OPTIMIZATION: Pre-renders the static path to an off-screen canvas.
 * This now uses the 'path' array which is updated by initPath (from map data).
 */
function precomputePath() {
  pathCanvas.width = MAP_GRID_W * TILE;
  pathCanvas.height = MAP_GRID_H * TILE;
  pathCtx.clearRect(0, 0, pathCanvas.width, pathCanvas.height); // Clear previous path

  // Make sure there is a path to draw
  if (!path || path.length < 2) return;

  // Set properties for smooth corners
  pathCtx.lineCap = "round";
  pathCtx.lineJoin = "round";

  // --- Start Drawing the New Path Style ---

  // 1. Draw the wide, soft outer glow.
  // This is a very wide, very transparent line that creates the glow effect.
  pathCtx.strokeStyle = "#29e3ff"; // A nice glowing cyan color
  pathCtx.lineWidth = 15;
  pathCtx.globalAlpha = 0.2; // Set transparency to 20%

  pathCtx.beginPath();
  pathCtx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    pathCtx.lineTo(path[i].x, path[i].y);
  }
  pathCtx.stroke();

  // 2. Draw a slightly brighter middle glow.
  // We draw over the same path, but with a thinner line and less transparency.
  pathCtx.lineWidth = 7;
  pathCtx.globalAlpha = 0.4; // Set transparency to 40%
  pathCtx.stroke(); // No need to beginPath again, just stroke the same path

  // 3. Draw the bright, solid inner core.
  // This is the final, thin, bright line that makes the path look like an energy beam.
  pathCtx.strokeStyle = "#ffffff"; // A pure white core
  pathCtx.lineWidth = 3;
  pathCtx.globalAlpha = 1; // Fully opaque
  pathCtx.stroke();
}

/**
 * The main game loop.
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

  // --- MODIFIED PROJECTILE UPDATE LOGIC ---
  for (const p of projectiles) {
    if (p.isEnemyProjectile || p.isBossProjectile) {
      p.update(dt);
    } else {
      p.update(dt, enemies);
    }
  }
  // --- END MODIFIED LOGIC ---

  for (const e of enemies) e.update(dt);
  updateEffects(dt);

  // OPTIMIZATION: Efficiently remove dead entities without repeated splicing.
  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (projectiles[i].dead) projectiles.splice(i, 1);
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].dead) enemies.splice(i, 1);
  }

  // --- WIN/LOSS CHECKS ---
  if (state.lives <= 0) {
    gameOver();
    return;
  }
  if (
    state.wave >= currentLevelConfig.waves.length &&
    enemies.length === 0 &&
    state.toSpawn.length === 0
  ) {
    levelComplete();
    return;
  }

  // --- DRAWING LOGIC ---

  // 1. Clear the whole canvas and draw a base background color
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.fillStyle = "#0b0f1a";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  ctx.save(); // Save the untransformed context state

  // Apply camera and zoom transformations for the game world
  ctx.translate(-state.camera.x * state.zoom, -state.camera.y * state.zoom);
  ctx.scale(state.zoom, state.zoom);

  // Draw the loaded map first (game world layer 0)
  drawMap(state.camera, state.zoom);
  // Draw pre-rendered grid over the map (game world layer 1)
  ctx.drawImage(gridCanvas, 0, 0);
  // ctx.drawImage(pathCanvas, 0, 0); // COMMENTED OUT: Don't draw the path line

  // --- MODIFICATION START: NEW AURA RENDERING LOGIC ---
  // 1. Clear the aura buffer for this frame.
  auraCtx.clearRect(0, 0, auraCanvas.width, auraCanvas.height);

  // 2. Populate the buffer by drawing each Disruptor's opaque aura onto it.
  for (const e of enemies) {
    if (e.type === "disruptor" && !e.dead) {
      e.drawAuraToBuffer(auraCtx);
    }
  }

  // 3. Draw the complete, merged aura buffer to the main canvas with a single alpha setting.
  ctx.globalAlpha = 0.25; // Apply transparency to the entire layer at once
  ctx.drawImage(auraCanvas, 0, 0);
  ctx.globalAlpha = 1.0; // Reset alpha for other drawing operations
  // --- MODIFICATION END ---

  // --- Draw dynamic game world elements (ghosts, ranges, entities) ---
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
  for (const t of towers) {
    t.draw();

    // --- DRAW HP BAR FOR EACH TOWER ---
    if (
      typeof t.hp === "number" &&
      typeof t.maxHp === "number" &&
      t.maxHp > 0
    ) {
      const spec = t.spec();
      const cells = getOccupiedCells(t.gx, t.gy, spec.size);
      const minGy = Math.min(...cells.map((c) => c.gy));
      const minGx = Math.min(...cells.map((c) => c.gx));
      const maxGx = Math.max(...cells.map((c) => c.gx));

      const barWidth = (maxGx - minGx + 1) * TILE * 0.8;
      const barHeight = 4;

      const x = t.center.x - barWidth / 2;
      const y = minGy * TILE - barHeight - 3;

      ctx.fillStyle = "rgba(40, 40, 40, 0.7)";
      ctx.fillRect(x, y, barWidth, barHeight);

      const hpPercentage = Math.max(0, t.hp / t.maxHp);
      if (hpPercentage > 0.6) {
        ctx.fillStyle = "#4CAF50"; // Green
      } else if (hpPercentage > 0.3) {
        ctx.fillStyle = "#FFC107"; // Yellow
      } else {
        ctx.fillStyle = "#F44336"; // Red
      }
      ctx.fillRect(x, y, barWidth * hpPercentage, barHeight);
    }
    // --- END NEW HP BAR LOGIC ---
  }

  for (const e of enemies) e.draw();
  for (const p of projectiles) p.draw();
  drawEffects();

  ctx.restore(); // Restore the canvas to its untransformed (screen) state

  // --- Draw UI elements on top of everything else ---
  drawTopbar(canvas.clientWidth);
  drawShop(canvas.clientWidth, canvas.clientHeight);
  drawInspector(ui.selectedTower, state.camera, state.zoom);

  animationFrameId = requestAnimationFrame(loop);
}

/**
 * Public function to initialize and start a specific level.
 */
export async function startGame(levelNumber) {
  soundManager.setBossSoundsEnabled(true);
  // Made async to await map loading
  currentLevelConfig = levels.find((l) => l.level === levelNumber);
  if (!currentLevelConfig) {
    alert(`Error: Level ${levelNumber} configuration not found!`);
    return;
  }

  // Load the map for the current level
  try {
    currentLoadedMapData = await loadMap(currentLevelConfig.mapFile);
  } catch (error) {
    alert(`Failed to load map for level ${levelNumber}: ${error.message}`);
    console.error(error);
    return;
  }

  // Update core map dimensions based on the loaded map
  setMapDimensions(currentLoadedMapData.width, currentLoadedMapData.height);
  state.currentLevelConfig = currentLevelConfig; // Make the level config globally accessible

  resetState(currentLevelConfig);
  resize(); // Recalculate canvas size based on new MAP_GRID_W/H
  initPath(); // Now initPath gets its data from the loaded map

  // --- MODIFICATION START ---
  // Resize the new aura canvas to match the full map dimensions
  auraCanvas.width = MAP_GRID_W * TILE;
  auraCanvas.height = MAP_GRID_H * TILE;
  // --- MODIFICATION END ---

  // --- OPTIMIZATION: Pre-render static elements for this level ---
  precomputeGrid();
  precomputePath(); // Still precompute path so pointAt works, but won't draw it

  last = performance.now();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  state.running = true; // Set running state before requesting frame
  animationFrameId = requestAnimationFrame(loop);
}

function stopGame() {
  soundManager.setBossSoundsEnabled(false);

  state.running = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function gameOver() {
  soundManager.setBossSoundsEnabled(false);
  stopGame();
  // Draw one final frame to show the game over state
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); // Clear the whole canvas
  drawMap(state.camera, state.zoom); // Draw the map (game world background)
  ctx.drawImage(gridCanvas, 0, 0); // Draw grid
  // ctx.drawImage(pathCanvas, 0, 0); // COMMENTED OUT: Don't draw path

  // Now draw the UI elements on top
  drawTopbar(canvas.clientWidth);
  ctx.fillStyle = "rgba(10,20,36,0.86)"; // Overlay for game over
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
  soundManager.setBossSoundsEnabled(false);

  stopGame();
  const unlocked = parseInt(
    localStorage.getItem("towerDefenseHighestLevel") || "1"
  );
  if (currentLevelConfig.level >= unlocked) {
    localStorage.setItem(
      "towerDefenseHighestLevel",
      currentLevelConfig.level + 1
    );
  }
  // Draw one final frame for the victory screen
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); // Clear the whole canvas
  drawMap(state.camera, state.zoom); // Draw the map (game world background)
  ctx.drawImage(gridCanvas, 0, 0); // Draw grid
  // ctx.drawImage(pathCanvas, 0, 0); // COMMENTED OUT: Don't draw path

  // Now draw the UI elements on top
  drawTopbar(canvas.clientWidth);
  ctx.fillStyle = "rgba(10, 36, 20, 0.86)"; // Overlay for victory
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

// --- INPUT HANDLING (No changes below this line, but make sure MAP_GRID_W/H is updated) ---
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
    const spec = ui.selectedTower.spec();
    if (ui.selectedTower.level >= spec.maxLevel) {
      pulse("Max Level!", "#f66");
      return true;
    }
    const cost = ui.selectedTower.upgradeCost();
    if (state.money >= cost) {
      state.money -= cost;
      ui.selectedTower.level++;
      if (typeof ui.selectedTower.maxHp === "number") {
        ui.selectedTower.maxHp = Math.round(ui.selectedTower.maxHp * 1.25);
        ui.selectedTower.hp = ui.selectedTower.maxHp;
      }
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
    const towerIndex = towers.findIndex((t) => t === ui.selectedTower);
    if (towerIndex > -1) {
      towers.splice(towerIndex, 1);
    }
    ui.selectedTower = null;
    updateOccupiedCells();
    pulse(`Sell +$${sellValue}`, "#afb");
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
        // --- MODIFIED TOWER CREATION ---
        const newTower = new spec.class(mouse.gx, mouse.gy, ui.selectedShopKey);
        // Set initial level from persistent data
        newTower.level = window.playerData.towerLevels[ui.selectedShopKey] || 1;
        towers.push(newTower);

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
        if (state.money < spec.cost) {
          pulse("Not enough money!", "#f66");
        } else {
          touch.potentialSelection = button.key;
          touch.holdTimer = setTimeout(() => {
            touch.isHolding = true;
            ui.selectedShopKey = button.key;
            ui.selectedTower = null;
            touch.potentialSelection = null;
          }, HOLD_DURATION);
        }
      }
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
      const gx = ui.hoveredTile ? ui.hoveredTile.gx : -1;
      const gy = ui.hoveredTile ? ui.hoveredTile.gy : -1;
      if (touch.currentY < canvas.clientHeight - 100) {
        const spec = TOWER_TYPES[ui.selectedShopKey];
        if (isPlacementValid(gx, gy, spec)) {
          if (state.money >= spec.cost) {
            const newTower = new spec.class(gx, gy, ui.selectedShopKey);
            newTower.level =
              window.playerData.towerLevels[ui.selectedShopKey] || 1;
            towers.push(newTower);

            state.money -= spec.cost;
            pulse(`-${spec.cost}`);
            updateOccupiedCells();
            ui.selectedShopKey = null;
          } else {
            pulse("Not enough $", "#f66");
            ui.selectedShopKey = null; // Clear shop selection even if not enough money after attempting placement
          }
        } else {
          ui.selectedShopKey = null; // Clear shop selection if placement was invalid
        }
      } else {
        ui.selectedShopKey = null; // Clear shop selection if dropped in shop area
      }
    } else if (!wasHolding && wasJustATap) {
      if (handleInspectorClick({ x: touch.startX, y: touch.startY })) {
        // Click was handled by inspector, do nothing else
      } else if (touch.action === "scrollingShop" && touch.potentialSelection) {
        ui.selectedShopKey =
          ui.selectedShopKey === touch.potentialSelection
            ? null
            : touch.potentialSelection;
        ui.selectedTower = null;
      } else if (touch.action === "panning") {
        const worldX = touch.startX / state.zoom + state.camera.x;
        const worldY = touch.startY / state.zoom + state.camera.y;
        const gx = Math.floor(worldX / TILE);
        const gy = Math.floor(worldY / TILE);
        const clickedTower = findTowerAt(gx, gy);

        if (clickedTower) {
          // Priority: If an existing tower was tapped, select it
          ui.selectedTower =
            ui.selectedTower === clickedTower ? null : clickedTower;
          ui.selectedShopKey = null; // IMPORTANT: Clear any active shop selection
        } else if (ui.selectedShopKey) {
          // If no existing tower, but a shop item is selected, try to place it
          const spec = TOWER_TYPES[ui.selectedShopKey];
          if (isPlacementValid(gx, gy, spec) && state.money >= spec.cost) {
            const newTower = new spec.class(gx, gy, ui.selectedShopKey);
            newTower.level =
              window.playerData.towerLevels[ui.selectedShopKey] || 1;
            towers.push(newTower);

            state.money -= spec.cost;
            pulse(`-${spec.cost}`);
            updateOccupiedCells();
            ui.selectedShopKey = null;
          } else {
            if (state.money < spec.cost) {
              pulse("Not enough $", "#f66");
            }
            // If placement is invalid or not enough money, still clear shop selection
            ui.selectedShopKey = null;
          }
        } else {
          // No existing tower, no shop item selected. Tap on empty space.
          ui.selectedTower = null;
          ui.selectedShopKey = null; // Clear any lingering shop selection (redundant if previous checks handled it, but safe)
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
  ui.selectedShopKey = null;
});

// --- Game Initialization Logic ---
// --- Game Initialization Logic ---
async function initializeGame() {
  // Define all sound configurations
  const soundConfigs = [
    {
      id: "gunnerShoot",
      path: "./assets/sounds/gunnerTower.mp3",
      volume: 0.2,
      maxInstances: 5,
    },
    {
      id: "cannonShoot",
      path: "./assets/sounds/cannonTower.mp3",
      volume: 0.6,
      maxInstances: 5,
    },
    {
      id: "doubleCannonShoot",
      path: "./assets/sounds/doubleCannonTower.mp3",
      volume: 0.6,
      maxInstances: 5,
    },
    {
      id: "laserShoot",
      path: "./assets/sounds/laserTower.mp3",
      volume: 0.2,
      maxInstances: 3,
    },
    {
      id: "iceShoot",
      path: "./assets/sounds/iceTower.mp3",
      volume: 0.2,
      maxInstances: 5,
    },
    {
      id: "teslaShoot",
      path: "./assets/sounds/teslaTower.mp3",
      volume: 0.2,
      maxInstances: 4,
    },
    {
      id: "poisonShoot",
      path: "./assets/sounds/poisonTower.mp3",
      volume: 4,
      maxInstances: 2,
    },
    {
      id: "missleShoot",
      path: "./assets/sounds/missleTower.mp3",
      volume: 1,
      maxInstances: 3,
    },
    {
      id: "flameThrougherShoot",
      path: "./assets/sounds/flameThrougherTower.mp3",
      volume: 5,
      maxInstances: 3,
    },
    {
      id: "sniperShoot",
      path: "./assets/sounds/sniperTower.mp3",
      volume: 5,
      maxInstances: 3,
    },
    {
      id: "artillaryShoot",
      path: "./assets/sounds/artillaryTower.mp3",
      volume: 5,
      maxInstances: 3,
    },
    {
      id: "archerShoot",
      path: "./assets/sounds/archerTower.mp3",
      volume: 5,
      maxInstances: 3,
    },
    {
      id: "lightningShoot",
      path: "./assets/sounds/lightningTower.mp3",
      volume: 2,
      maxInstances: 3,
    },
    {
      id: "shadowShoot",
      path: "./assets/sounds/shadowTower.mp3",
      volume: 1,
      maxInstances: 3,
    },
    {
      id: "wizardShoot",
      path: "./assets/sounds/wizardTower.mp3",
      volume: 3,
      maxInstances: 3,
    },
    {
      id: "windShoot",
      path: "./assets/sounds/windTower.mp3",
      volume: 3,
      maxInstances: 3,
    },
    {
      id: "volcanoShoot",
      path: "./assets/sounds/volcanoTower.mp3",
      volume: 3,
      maxInstances: 3,
    },
    {
      id: "volcanoShoot1",
      path: "./assets/sounds/volcanoTower1.mp3",
      volume: 3,
      maxInstances: 3,
    },
    {
      id: "carM249Shoot",
      path: "./assets/sounds/carM249Tower.mp3",
      volume: 3,
      maxInstances: 3,
    },
    {
      id: "smallTankShoot",
      path: "./assets/sounds/smallTankTower.mp3",
      volume: 2,
      maxInstances: 3,
    },
    {
      id: "mediumTankShoot",
      path: "./assets/sounds/mediumTankTower.mp3",
      volume: 3,
      maxInstances: 1,
    },
    {
      id: "bigTankShoot",
      path: "./assets/sounds/bigTankTower.mp3",
      volume: 3,
      maxInstances: 2,
    },
    {
      id: "bigTankRifleShoot",
      path: "./assets/sounds/bigTankTowerRifle.mp3",
      volume: 3,
      maxInstances: 2,
    },
    {
      id: "behemothTankShoot",
      path: "./assets/sounds/behemothTankTower.mp3",
      volume: 3,
      maxInstances: 2,
    },
    {
      id: "behemothRifleShoot",
      path: "./assets/sounds/behemothTankRifle.mp3",
      volume: 3,
      maxInstances: 2,
    },
    {
      id: "smallhelicopterMove",
      path: "./assets/sounds/smallHelicopterTower.mp3",
      volume: 2,
      maxInstances: 2,
    },
    {
      id: "blackHawkMove",
      path: "./assets/sounds/blackHawkTower.mp3",
      volume: 2,
      maxInstances: 2,
    },
    {
      id: "smallHelicopterRifle",
      path: "./assets/sounds/smallHelicopterRifle.mp3",
      volume: 2,
      maxInstances: 2,
    },
    {
      id: "blackHawkRifle",
      path: "./assets/sounds/blackHawkRifle.mp3",
      volume: 2,
      maxInstances: 2,
    },
    {
      id: "jetShoot",
      path: "./assets/sounds/jetTower.mp3",
      volume: 2,
      maxInstances: 2,
    },
    {
      id: "jetExplosion",
      path: "./assets/sounds/jetTowerExplosion.mp3",
      volume: 2,
      maxInstances: 2,
    },
    {
      id: "b2Alarm",
      path: "./assets/sounds/b2Alarm.mp3",
      volume: 2,
      maxInstances: 1,
    },
    {
      id: "b2Launch",
      path: "./assets/sounds/b2Launch.mp3",
      volume: 2,
      maxInstances: 2,
    },
    {
      id: "b2Explosion",
      path: "./assets/sounds/B2Explosion.mp3",
      volume: 2,
      maxInstances: 2,
    },
    {
      id: "goliathMove",
      path: "./assets/sounds/goliathMove.mp3",
      volume: 2,
      maxInstances: 2,
      isBossSound: true,
    },
    {
      id: "minionSpawn",
      path: "./assets/sounds/minionSpawn.mp3",
      volume: 2,
      maxInstances: 2,
      isBossSound: true,
    },
    {
      id: "phantomMove",
      path: "./assets/sounds/phantomMove.mp3",
      volume: 2,
      maxInstances: 2,
      isBossSound: true,
    },
    {
      id: "phantomTeleport",
      path: "./assets/sounds/phantomTeleport.mp3",
      volume: 2,
      maxInstances: 2,
      isBossSound: true,
    },
    {
      id: "phantomHit",
      path: "./assets/sounds/phantomHit.mp3",
      volume: 2,
      maxInstances: 2,
      isBossSound: true,
    },
    {
      id: "warlockStun",
      path: "./assets/sounds/warlockStun.mp3",
      volume: 2,
      maxInstances: 2,
      isBossSound: true,
    },
    {
      id: "warlockMove",
      path: "./assets/sounds/warlockMove.mp3",
      volume: 2,
      maxInstances: 2,
      isBossSound: true,
    },
    {
      id: "JuggernautRifle",
      path: "./assets/sounds/JuggernautRifle.mp3",
      volume: 2,
      maxInstances: 2,
      isBossSound: true,
    },
  ];

  try {
    // Load all sounds in parallel
    await Promise.all(
      soundConfigs.map((config) =>
        soundManager.loadSound(
          config.id,
          config.path,
          config.volume,
          config.maxInstances,
          config.isBossSound
        )
      )
    );

    console.log("All sounds loaded successfully");

    // Set up audio resume on user interaction
    const resumeAudio = () => {
      soundManager.resumeAudio();
      document.removeEventListener("click", resumeAudio);
      document.removeEventListener("touchend", resumeAudio);
      document.removeEventListener("keydown", resumeAudio);
    };

    document.addEventListener("click", resumeAudio, { once: true });
    document.addEventListener("touchend", resumeAudio, { once: true });
    document.addEventListener("keydown", resumeAudio, { once: true });

    soundManager.setBossSoundsEnabled(false);
    // Start the game
    // await startGame(1);
  } catch (error) {
    console.error("Error loading sounds:", error);
    // Handle error (maybe continue without some sounds or show error message)
  }
}
// Set up audio resume on user interaction
const setupAudioResume = () => {
  // Try to resume immediately
  soundManager.resumeAudio().then((success) => {
    if (!success) {
      // If failed, set up retry on next user interaction
      const retryAudio = () => {
        soundManager.resumeAudio();
        document.removeEventListener("click", retryAudio);
        document.removeEventListener("touchend", retryAudio);
      };

      document.addEventListener("click", retryAudio);
      document.addEventListener("touchend", retryAudio);
    }
  });
};

// Call this on DOM content loaded
document.addEventListener("DOMContentLoaded", () => {
  setupAudioResume();
  initializeGame();
});

// Main entry - wires everything together
import { canvas, ctx, TILE, resize, syncLogicalSize } from "./core.js";
import { state, enemies, towers, projectiles, particles } from "./state.js";
import { rand, clamp, dist, TAU, removeFromArray, pulse } from "./utils.js";
import { TOWER_TYPES } from "./config.js";
import { initPath, path, blocked, totalLen } from "./path.js";
import { Enemy, Tower, Bullet } from "./entities.js";
import { spawnMuzzle, spawnHit, spawnExplosion, spawnDeath, spawnBeam, updateEffects, drawEffects } from "./effects.js";
import { spawner, startNextWave } from "./spawner.js";
import { drawBackground, drawTopbar, drawShop, drawGhost, drawInspector, getShopButtons } from "./ui.js";
import { ui } from "./state.js";

// Ensure sizes
resize();
syncLogicalSize();
initPath();

// local shortcuts
let mouse = { x: 0, y: 0, gx: 0, gy: 0 };

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
  mouse.gx = Math.floor(mouse.x / TILE);
  mouse.gy = Math.floor(mouse.y / TILE);
  ui.hoveredTile = { gx: mouse.gx, gy: mouse.gy };
});
canvas.addEventListener("mouseleave", () => (ui.hoveredTile = null));

canvas.addEventListener("click", () => {
  // Click on UI shop?
  if (mouse.y > ctx.canvas.clientHeight - 100) {
    const buttons = getShopButtons(ctx.canvas.clientWidth, ctx.canvas.clientHeight);
    for (const b of buttons) {
      if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) {
        ui.selectedShopKey = b.key;
        ui.selectedTower = null;
        return;
      }
    }
  }

  // Click existing tower to select
  const t = towers.find((t) => t.gx === mouse.gx && t.gy === mouse.gy);
  if (t) {
    ui.selectedTower = t;
    return;
  }

  // Place tower if tile is valid
  if (mouse.gx < 0 || mouse.gy < 0) return;
  if (mouse.gy >= Math.floor(ctx.canvas.clientHeight / TILE) - 2) return;
  if (blocked.has(`${mouse.gx},${mouse.gy}`)) return;
  if (towers.some((t) => t.gx === mouse.gx && t.gy === mouse.gy)) return;

  const spec = TOWER_TYPES[ui.selectedShopKey];
  if (state.money >= spec.cost) {
    towers.push(new Tower(mouse.gx, mouse.gy, ui.selectedShopKey));
    state.money -= spec.cost;
    pulse(`-${spec.cost}`);
  } else {
    pulse("Not enough $", "#f66");
  }
});

window.addEventListener("keydown", (e) => {
  if (!ui.selectedTower) return;
  if (e.key.toLowerCase() === "u") {
    const cost = ui.selectedTower.upgradeCost();
    if (state.money >= cost) {
      state.money -= cost;
      ui.selectedTower.level++;
      pulse(`Upgrade -${cost}`);
    } else pulse("Need more $", "#f66");
  }
  if (e.key.toLowerCase() === "s") {
    state.money += Math.round(ui.selectedTower.sellValue());
    removeFromArray(towers, ui.selectedTower);
    ui.selectedTower = null;
    pulse("Sold +$", "#9f9");
  }
});

// Main loop
let last = performance.now();
startNextWave();

function loop(ts) {
  const dt = Math.min(0.033, (ts - last) / 1000);
  last = ts;
  state.time += dt;
  if (!state.running) return;

  // Logic
  spawner(dt);
  for (const t of towers) t.update(dt, enemies);
  for (const b of projectiles) b.update(dt);
  for (const e of enemies) e.update(dt);
  updateEffects(dt);

  // Cull
  for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].dead) projectiles.splice(i, 1);
  for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) enemies.splice(i, 1);
  if (state.lives <= 0) {
    gameOver();
    return;
  }

  // Draw
  drawBackground(state.time, path);
  drawTopbar(ctx.canvas.clientWidth);
  drawShop(ctx.canvas.clientWidth, ctx.canvas.clientHeight);
  drawGhost(ui.hoveredTile, TILE, ui.selectedShopKey);
  for (const t of towers) t.draw();
  for (const e of enemies) e.draw();
  for (const b of projectiles) b.draw();
  drawEffects();
  drawInspector(ui.selectedTower);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function gameOver() {
  drawBackground(state.time, path);
  drawTopbar(ctx.canvas.clientWidth);
  ctx.fillStyle = "rgba(10,20,36,0.86)";
  ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
  ctx.fillStyle = "#fff";
  ctx.font = "800 48px Inter";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", ctx.canvas.clientWidth / 2, ctx.canvas.clientHeight / 2 - 10);
  ctx.font = "500 18px Inter";
  ctx.fillStyle = "#bfe7ff";
  ctx.fillText(`You reached wave ${state.wave}. Refresh to try again!`, ctx.canvas.clientWidth / 2, ctx.canvas.clientHeight / 2 + 28);
  ctx.textAlign = "start";
}

// Optional font loader (same as original)
(async () => {
  try {
    const inter = new FontFace(
      "Inter",
      "url(https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMaBZV.woff2)"
    );
    await inter.load();
    document.fonts.add(inter);
  } catch (e) {
    /* ignore */
  }
})();

// Notes:
// - Import these files as ES modules in an environment that supports them (modern browsers).
// - The project preserves the original class APIs (Enemy.pos getter, Tower.spec() method, Tower.center getter).
// - Call syncLogicalSize() and initPath() after the canvas is in the DOM (done above).
// - You can further split UI functions or tweak exports to taste.

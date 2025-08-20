// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\spawner.js =====

import { enemies, state } from "./state.js";
import { Enemy, getEnemiesForWave } from "./enemy.js";
import { pulse } from "./utils.js";

let spawnTimer = 0;
let toSpawn = [];
let currentWaveEnemies = [];

export function startNextWave() {
  state.wave++;
  currentWaveEnemies = getEnemiesForWave(state.wave);
  toSpawn = [...currentWaveEnemies]; // Create a copy
  spawnTimer = 0;
  pulse(`Wave ${state.wave}!`, "#adf");
}

export function spawner(dt) {
  if (toSpawn.length === 0) {
    if (enemies.length === 0) startNextWave();
    return;
  }

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    const nextEnemy = toSpawn[0];
    enemies.push(new Enemy(nextEnemy.type, nextEnemy.tier));
    toSpawn.shift(); // Remove the first element

    // Adjust spawn timer based on wave difficulty
    spawnTimer = Math.max(0.25, 0.9 - state.wave * 0.03);
  }
}

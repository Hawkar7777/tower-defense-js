// ===== FILE: spawner.js =====

import { enemies, state } from "./state.js";
import { Enemy } from "./enemy.js";
import { pulse } from "./utils.js";
import { goliath } from "./boss/goliath.js";
import { phantom } from "./boss/phantom.js";
import { warlock } from "./boss/warlock.js";

let spawnTimer = 0;

export function startNextWave() {
  const levelConfig = state.currentLevelConfig;

  if (!levelConfig || state.wave >= levelConfig.waves.length) {
    return;
  }

  state.wave++;
  const waveConfig = levelConfig.waves[state.wave - 1];

  if (waveConfig.types && waveConfig.count) {
    const enemyTypes = Object.keys(waveConfig.types);
    for (let i = 0; i < waveConfig.count; i++) {
      const weights = enemyTypes.map((t) => waveConfig.types[t]);
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      let random = Math.random() * totalWeight;
      let chosenType = enemyTypes[0];
      for (let j = 0; j < enemyTypes.length; j++) {
        random -= weights[j];
        if (random <= 0) {
          chosenType = enemyTypes[j];
          break;
        }
      }
      const tier = Math.floor((state.wave - 1) / 1.5);
      state.toSpawn.push({ type: chosenType, tier });
    }
  }

  if (waveConfig.boss) {
    let bossInstance;
    switch (waveConfig.boss) {
      case "Goliath":
        bossInstance = new goliath();
        break;
      case "Phantom":
        bossInstance = new phantom();
        break;
      // --- ADDITION 2: Add Warlock to the spawner ---
      case "Warlock":
        bossInstance = new warlock();
        break;
      // --- END OF ADDITION ---
      default:
        console.error("Unknown boss type in levels.js:", waveConfig.boss);
    }

    if (bossInstance) {
      enemies.push(bossInstance);
    }
  }

  spawnTimer = 0;
  pulse(`Wave ${state.wave}!`, "#adf");
}

export function spawner(dt) {
  if (state.toSpawn.length === 0) {
    if (
      enemies.length === 0 &&
      state.wave < state.currentLevelConfig.waves.length
    ) {
      startNextWave();
    }
    return;
  }

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    const nextEnemy = state.toSpawn.shift();
    if (nextEnemy) {
      enemies.push(new Enemy(nextEnemy.type, nextEnemy.tier));
    }

    spawnTimer = Math.max(0.25, 0.9 - state.wave * 0.03);
  }
}

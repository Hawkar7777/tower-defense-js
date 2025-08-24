// ===== FILE: spawner.js =====

import { enemies, state } from "./state.js";
import { Enemy } from "./enemy.js";
import { pulse } from "./utils.js";

let spawnTimer = 0;

export function startNextWave() {
  const levelConfig = state.currentLevelConfig;

  // Do not start a new wave if the previous one was the last.
  if (!levelConfig || state.wave >= levelConfig.waves.length) {
    return;
  }

  state.wave++;
  const waveConfig = levelConfig.waves[state.wave - 1];

  // Generate the enemies for the wave based on the configuration
  const enemyTypes = Object.keys(waveConfig.types);
  for (let i = 0; i < waveConfig.count; i++) {
    const weights = enemyTypes.map((t) => waveConfig.types[t]);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    let chosenType = enemyTypes[0]; // Default to the first type as a fallback
    for (let j = 0; j < enemyTypes.length; j++) {
      random -= weights[j];
      if (random <= 0) {
        chosenType = enemyTypes[j];
        break;
      }
    }

    // Tier can still be calculated based on wave number, as in the original logic.
    const tier = Math.floor((state.wave - 1) / 1.5);
    state.toSpawn.push({ type: chosenType, tier });
  }

  spawnTimer = 0;
  pulse(`Wave ${state.wave}!`, "#adf");
}

export function spawner(dt) {
  if (state.toSpawn.length === 0) {
    // If there are no enemies left on the map and there are more waves to come, start the next one.
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

    // Adjust spawn timer based on wave difficulty
    spawnTimer = Math.max(0.25, 0.9 - state.wave * 0.03);
  }
}

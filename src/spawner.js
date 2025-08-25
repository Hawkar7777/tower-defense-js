import { enemies, state } from "./state.js";
import { pulse } from "./utils.js";
import { ENEMY_TYPES } from "./enemy/enemyTypes.js";
// --- NEW: Import totalLen to calculate path distance ---
import { totalLen } from "./path.js";

// --- Enemy Imports ---
import { BaseEnemy } from "./enemy/BaseEnemy.js";
import { Sapper } from "./enemy/Sapper.js";
import { Wraith } from "./enemy/Wraith.js";
import { Mimic } from "./enemy/Mimic.js";
import { Leech } from "./enemy/Leech.js";

// --- Boss Imports ---
import { goliath } from "./boss/goliath.js";
import { phantom } from "./boss/phantom.js";
import { warlock } from "./boss/warlock.js";
import { Juggernaut } from "./boss/Juggernaut.js";
import { Basilisk } from "./boss/Basilisk.js";

let spawnTimer = 0;

function createEnemy(type, tier) {
  const spec = ENEMY_TYPES[type];
  if (!spec) {
    console.error(`Unknown enemy type: ${type}. Spawning a basic enemy.`);
    return new BaseEnemy("basic", tier);
  }
  if (spec.isMimic) return new Mimic(tier);
  if (spec.isSupport) return new Wraith(tier);
  if (spec.isAttacker) return new Sapper(tier);
  if (spec.isLeech) {
    return new Leech(tier);
  }
  return new BaseEnemy(type, tier);
}

export function startNextWave() {
  const levelConfig = state.currentLevelConfig;
  if (!levelConfig || state.wave >= levelConfig.waves.length) return;
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
      case "Warlock":
        bossInstance = new warlock();
        break;
      case "Juggernaut":
        bossInstance = new Juggernaut();
        break;
      case "Basilisk": {
        const difficultyMult = 1 + (state.wave - 1) * 0.15;
        bossInstance = new Basilisk(difficultyMult);
        break;
      }
      default:
        console.error("Unknown boss type in levels.js:", waveConfig.boss);
    }
    if (bossInstance) enemies.push(bossInstance);
  }
  spawnTimer = 0;
  pulse(`Wave ${state.wave}!`, "#adf");
}

// --- CORRECTED: The spawner now manages spacing ---
export function spawner(dt) {
  if (
    state.toSpawn.length === 0 &&
    enemies.length === 0 &&
    state.wave < state.currentLevelConfig.waves.length
  ) {
    startNextWave();
    return;
  }

  spawnTimer -= dt;

  // Only try to spawn if the timer is ready AND there are enemies in the queue
  if (spawnTimer <= 0 && state.toSpawn.length > 0) {
    const lastEnemy = enemies.length > 0 ? enemies[enemies.length - 1] : null;
    let canSpawn = false;

    if (!lastEnemy) {
      // If the map is empty, we can always spawn.
      canSpawn = true;
    } else {
      // Otherwise, check if the last enemy spawned has moved far enough.
      const nextEnemyType = state.toSpawn[0].type;
      const nextEnemyRadius = ENEMY_TYPES[nextEnemyType].radius;

      // The minimum distance required between the centers of the two enemies.
      const desiredGap = 15; // <--- YOU CAN CHANGE THIS VALUE
      const requiredDistancePixels = lastEnemy.r + nextEnemyRadius + desiredGap;

      // Convert this pixel distance into a percentage of the total path length.
      const requiredT = requiredDistancePixels / totalLen;

      // If the last enemy has traveled further than this required distance, we can spawn.
      if (lastEnemy.t >= requiredT) {
        canSpawn = true;
      }
    }

    if (canSpawn) {
      const nextEnemyData = state.toSpawn.shift();
      enemies.push(createEnemy(nextEnemyData.type, nextEnemyData.tier));
      // Reset the timer for the *next* check.
      // A short timer ensures the spawner is responsive.
      spawnTimer = 0.1;
    }
  }
}

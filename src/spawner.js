import { enemies, state } from "./state.js";
import { pulse } from "./utils.js";
import { ENEMY_TYPES } from "./enemy/enemyTypes.js";

// --- Enemy Imports ---
import { BaseEnemy } from "./enemy/BaseEnemy.js";
import { Sapper } from "./enemy/Sapper.js"; // Assuming Sapper.js exists
import { Wraith } from "./enemy/Wraith.js"; // The new enemy class

// --- Boss Imports ---
import { goliath } from "./boss/goliath.js";
import { phantom } from "./boss/phantom.js";
import { warlock } from "./boss/warlock.js";
import { Juggernaut } from "./boss/Juggernaut.js";
import { Basilisk } from "./boss/Basilisk.js";

let spawnTimer = 0;

// --- NEW: Factory function to create the correct enemy object ---
// This function reads the enemy config and decides which class to use.
function createEnemy(type, tier) {
  const spec = ENEMY_TYPES[type];
  if (!spec) {
    console.error(`Unknown enemy type: ${type}. Spawning a basic enemy.`);
    return new BaseEnemy("basic", tier);
  }

  // Check for special flags in the config
  if (spec.isSupport) {
    return new Wraith(tier);
  }
  if (spec.isAttacker) {
    return new Sapper(tier);
  }

  // If no special flags, create a standard BaseEnemy
  return new BaseEnemy(type, tier);
}

export function startNextWave() {
  const levelConfig = state.currentLevelConfig;

  if (!levelConfig || state.wave >= levelConfig.waves.length) {
    return;
  }

  state.wave++;
  const waveConfig = levelConfig.waves[state.wave - 1];

  // Logic for spawning regular enemies (unchanged)
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

  // Logic for spawning bosses (unchanged)
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
    if (bossInstance) {
      enemies.push(bossInstance);
    }
  }

  spawnTimer = 0;
  pulse(`Wave ${state.wave}!`, "#adf");
}

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
  if (spawnTimer <= 0 && state.toSpawn.length > 0) {
    const nextEnemy = state.toSpawn.shift();
    if (nextEnemy) {
      // Use the factory function to create the enemy
      enemies.push(createEnemy(nextEnemy.type, nextEnemy.tier));
    }
    spawnTimer = Math.max(0.25, 0.9 - state.wave * 0.03);
  }
}

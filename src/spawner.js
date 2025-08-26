// ===== FILE: spawner.js =====

import { enemies, state } from "./state.js";
import { pulse } from "./utils.js";
import { ENEMY_TYPES } from "./enemy/enemyTypes.js";
import { totalLen } from "./path.js";

// --- Enemy Imports ---
import { BaseEnemy } from "./enemy/BaseEnemy.js";
import { Sapper } from "./enemy/Sapper.js";
import { Wraith } from "./enemy/Wraith.js";
import { Mimic } from "./enemy/Mimic.js";
import { Leech } from "./enemy/Leech.js";
import { Shifter } from "./enemy/Shifter.js";
import { Specter } from "./enemy/Specter.js";
import { Hive } from "./enemy/Hive.js";
import { Collector } from "./enemy/Collector.js";
import { Disruptor } from "./enemy/Disruptor.js";

// --- Boss Imports ---
import { goliath } from "./boss/goliath.js";
import { phantom } from "./boss/phantom.js";
import { warlock } from "./boss/warlock.js";
import { Juggernaut } from "./boss/Juggernaut.js";
import { Basilisk } from "./boss/Basilisk.js";
import { Marauder } from "./boss/Marauder.js";
import { Scorcher } from "./boss/Scorcher.js";
import { Devastator } from "./boss/Devastator.js";
import { Reaper } from "./boss/Reaper.js";

let spawnTimer = 0;

// --- NEW: Map boss names to their constructors for easier lookup ---
const BOSS_CONSTRUCTORS = {
  Goliath: goliath,
  Phantom: phantom,
  Warlock: warlock,
  Juggernaut: Juggernaut,
  Basilisk: Basilisk,
  Marauder: Marauder,
  Scorcher: Scorcher,
  Devastator: Devastator,
  Reaper: Reaper,
};

/**
 * Creates an instance of a boss based on its name and the current wave.
 * Handles specific constructor arguments for difficulty scaling.
 * @param {string} bossName - The name of the boss.
 * @param {number} waveNumber - The current wave number, used for difficulty scaling.
 * @returns {any | null} The boss instance or null if the boss is unknown.
 */
function createBossInstance(bossName, waveNumber) {
  const BossClass = BOSS_CONSTRUCTORS[bossName];
  if (BossClass) {
    const difficultyMult = 1 + (waveNumber - 1) * 0.15;
    // Apply difficulty multiplier to bosses that are designed to use it
    switch (bossName) {
      case "Basilisk":
      case "Marauder":
      case "Scorcher":
      case "Devastator":
      case "Reaper":
        return new BossClass(difficultyMult);
      default:
        return new BossClass();
    }
  }
  console.error(`Unknown boss type: ${bossName}.`);
  return null;
}

/**
 * Creates an enemy or boss instance based on type, tier, and wave, and `isBoss` flag.
 * @param {string} type - The type of enemy or boss (e.g., "basic", "Basilisk").
 * @param {number | null} tier - The enemy tier (for regular enemies), null for bosses.
 * @param {number} waveNumber - The current wave number, passed to boss constructors for scaling.
 * @param {boolean} isBoss - True if this entity is a boss, false otherwise.
 * @returns {any | null} The enemy/boss instance.
 */
function createEntity(type, tier, waveNumber, isBoss) {
  if (isBoss) {
    return createBossInstance(type, waveNumber);
  }

  // Handle regular enemies
  const spec = ENEMY_TYPES[type];
  if (!spec) {
    console.error(`Unknown enemy type: ${type}. Spawning a basic enemy.`);
    return new BaseEnemy(type, tier); // Fallback to basic enemy
  }

  if (spec.isMimic) return new Mimic(tier);
  if (spec.isSupport) return new Wraith(tier);
  if (spec.isAttacker) return new Sapper(tier);
  if (spec.isLeech) return new Leech(tier);
  if (spec.isShifter) return new Shifter(tier);
  if (spec.isHive) return new Hive(tier);
  if (spec.isSpecter) return new Specter(tier);
  if (spec.isCollector) return new Collector(tier);
  if (spec.isDisruptor) return new Disruptor(tier);

  return new BaseEnemy(type, tier);
}

export function startNextWave() {
  const levelConfig = state.currentLevelConfig;
  if (!levelConfig || state.wave >= levelConfig.waves.length) return;

  state.wave++;
  const currentWaveNumber = state.wave;
  const waveConfig = levelConfig.waves[currentWaveNumber - 1];

  // --- REVISED LOGIC FOR waveConfig.types (e.g., { count: 10, types: { boss: "Basilisk", brute: 0.5 } }
  // --- OR { count: 10, types: { bosses: ["Juggernaut", "Basilisk"], brute: 0.5 } }) ---
  if (waveConfig.types && typeof waveConfig.count === "number") {
    let bossesToSpawnFromTypes = []; // Use an array for potentially multiple bosses
    let bossToSpawnFromSingularType = null; // For the singular 'boss' key
    const actualEnemyTypesForRandom = {};

    for (const typeKey in waveConfig.types) {
      if (typeKey === "boss" && typeof waveConfig.types[typeKey] === "string") {
        // Handle singular 'boss' key within 'types'
        bossToSpawnFromSingularType = waveConfig.types[typeKey];
      } else if (
        typeKey === "bosses" &&
        Array.isArray(waveConfig.types[typeKey])
      ) {
        // Handle plural 'bosses' array within 'types'
        bossesToSpawnFromTypes.push(...waveConfig.types[typeKey]);
      } else {
        // For other keys, ensure their values are numbers (probabilities)
        if (typeof waveConfig.types[typeKey] === "number") {
          actualEnemyTypesForRandom[typeKey] = waveConfig.types[typeKey];
        } else {
          console.warn(
            `Invalid type probability for '${typeKey}': ${waveConfig.types[typeKey]}. Skipping.`
          );
        }
      }
    }

    // Add boss(es) found in 'types' to the spawn queue
    if (bossToSpawnFromSingularType) {
      state.toSpawn.push({
        type: bossToSpawnFromSingularType,
        tier: null,
        isBoss: true,
        waveNumber: currentWaveNumber,
      });
      waveConfig.count--; // Decrement count for this boss
    }
    for (const bossName of bossesToSpawnFromTypes) {
      if (typeof bossName === "string") {
        state.toSpawn.push({
          type: bossName,
          tier: null,
          isBoss: true,
          waveNumber: currentWaveNumber,
        });
        waveConfig.count--; // Decrement count for each boss
      } else {
        console.warn(
          `Invalid boss name in 'bosses' array within 'types' object: ${bossName}. Skipping.`
        );
      }
    }

    if (waveConfig.count < 0) waveConfig.count = 0; // Prevent negative count

    // Now process the remaining `waveConfig.count` for random enemies based on `actualEnemyTypesForRandom`
    const enemyTypesForRandom = Object.keys(actualEnemyTypesForRandom);
    if (enemyTypesForRandom.length > 0 && waveConfig.count > 0) {
      const weights = enemyTypesForRandom.map(
        (t) => actualEnemyTypesForRandom[t]
      );
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

      if (totalWeight === 0) {
        console.warn(
          "Total weight for random enemy types is zero after boss extraction. Skipping random enemy spawn."
        );
      } else {
        for (let i = 0; i < waveConfig.count; i++) {
          let random = Math.random() * totalWeight;
          let chosenType = enemyTypesForRandom[0];
          for (let j = 0; j < enemyTypesForRandom.length; j++) {
            random -= weights[j];
            if (random <= 0) {
              chosenType = enemyTypesForRandom[j];
              break;
            }
          }
          const tier = Math.floor((currentWaveNumber - 1) / 1.5);
          state.toSpawn.push({
            type: chosenType,
            tier: tier,
            isBoss: false,
            waveNumber: currentWaveNumber,
          });
        }
      }
    }
  }
  // --- END REVISED LOGIC FOR waveConfig.types ---

  // Handle a single boss directly specified (e.g., { boss: "Phantom" })
  if (waveConfig.boss && typeof waveConfig.boss === "string") {
    state.toSpawn.push({
      type: waveConfig.boss,
      tier: null,
      isBoss: true,
      waveNumber: currentWaveNumber,
    });
  }

  // Handle multiple bosses specified in 'bosses' array (e.g., { bosses: ["Juggernaut", "Basilisk"] })
  if (waveConfig.bosses && Array.isArray(waveConfig.bosses)) {
    for (const bossName of waveConfig.bosses) {
      if (typeof bossName === "string") {
        // Ensure bossName is a string
        state.toSpawn.push({
          type: bossName,
          tier: null,
          isBoss: true,
          waveNumber: currentWaveNumber,
        });
      } else {
        console.warn(
          `Invalid boss name in 'bosses' array: ${bossName}. Skipping.`
        );
      }
    }
  }

  spawnTimer = 0;
  pulse(`Wave ${state.wave}!`, "#adf");
}

export function spawner(dt) {
  // If no enemies left and no more waves, and all enemies are cleared, return
  if (
    state.toSpawn.length === 0 &&
    enemies.length === 0 &&
    state.wave >= state.currentLevelConfig.waves.length
  ) {
    return;
  }

  // Automatically start the next wave if the current wave is depleted
  // and there are still waves left in the level config
  if (
    state.toSpawn.length === 0 &&
    enemies.length === 0 &&
    state.wave < state.currentLevelConfig.waves.length
  ) {
    startNextWave();
    return;
  }

  spawnTimer -= dt;

  // Only try to spawn if the timer is ready AND there are entities in the queue
  if (spawnTimer <= 0 && state.toSpawn.length > 0) {
    const lastEntity = enemies.length > 0 ? enemies[enemies.length - 1] : null;
    let canSpawn = false;

    if (!lastEntity) {
      // If the map is empty, we can always spawn the first entity.
      canSpawn = true;
    } else {
      const nextEntityData = state.toSpawn[0];
      let nextEntityRadius;

      // --- ROBUST RADIUS CALCULATION ---
      if (nextEntityData.isBoss) {
        // Try to get radius from ENEMY_TYPES if boss specs are there, otherwise use a default
        nextEntityRadius =
          ENEMY_TYPES[nextEntityData.type] &&
          typeof ENEMY_TYPES[nextEntityData.type].radius === "number"
            ? ENEMY_TYPES[nextEntityData.type].radius
            : 25; // Default boss radius
      } else {
        const enemySpec = ENEMY_TYPES[nextEntityData.type];
        if (enemySpec && typeof enemySpec.radius === "number") {
          nextEntityRadius = enemySpec.radius;
        } else {
          console.warn(
            `Radius not found for enemy type: ${nextEntityData.type}. Using default radius.`
          );
          nextEntityRadius = 10; // Default radius for unknown or missing enemy radius
        }
      }
      // --- END ROBUST RADIUS CALCULATION ---

      const desiredGap = 15; // <--- YOU CAN CHANGE THIS VALUE for spacing between enemies/bosses
      const requiredDistancePixels =
        lastEntity.r + nextEntityRadius + desiredGap;

      const requiredT = totalLen === 0 ? 0 : requiredDistancePixels / totalLen;

      if (lastEntity.t >= requiredT) {
        canSpawn = true;
      }
    }

    if (canSpawn) {
      const nextEntityData = state.toSpawn.shift();
      const newEntity = createEntity(
        nextEntityData.type,
        nextEntityData.tier,
        nextEntityData.waveNumber,
        nextEntityData.isBoss
      );
      if (newEntity) {
        enemies.push(newEntity);
      }
      spawnTimer = 0.1;
    }
  }
}

// src/enemy.js

// Import all the new, individual enemy classes
import { Scout } from "./enemy/Scout.js";
import { Brute } from "./enemy/Brute.js";
import { Swift } from "./enemy/Swift.js";
import { Elite } from "./enemy/Elite.js";
import { Sapper } from "./enemy/Sapper.js";

// A map to make creating enemies easy
const enemyClassMap = {
  basic: Scout,
  brute: Brute,
  swift: Swift,
  elite: Elite,
  sapper: Sapper,
};

/**
 * This function creates and returns an instance of the correct enemy class.
 * Your spawner will call this instead of `new Enemy()`.
 * @param {string} type - The key for the enemy type (e.g., 'basic', 'sapper').
 * @param {number} tier - The tier of the enemy.
 * @returns A new enemy object.
 */
export function createEnemy(type, tier) {
  const EnemyClass = enemyClassMap[type];
  if (EnemyClass) {
    return new EnemyClass(tier);
  } else {
    // Failsafe: if the type is unknown, create a basic Scout
    console.warn(`Unknown enemy type "${type}", defaulting to Scout.`);
    return new Scout(tier);
  }
}

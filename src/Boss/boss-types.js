// This file contains the static data definitions for all bosses.
export const BOSS_TYPES = {
  Goliath: {
    name: "Goliath",
    baseHp: 5000,
    baseShieldHp: 2500,
    baseSpeed: 25,
    baseReward: 500,
    radius: 30,
    color: "#2a0a4a",
    glowColor: "#ff4040",
    detailColor: "#8e44ad",
    shieldColor: "rgba(52, 152, 219, 0.7)",
    livesPenalty: 10,
  },
  Phantom: {
    name: "Phantom",
    baseHp: 6000,
    baseSpeed: 60,
    baseReward: 450,
    radius: 18,
    color: "#d7dfe2",
    glowColor: "#00ffff",
    detailColor: "#7f8c8d",
    livesPenalty: 15,
  },
  Warlock: {
    name: "Warlock",
    baseHp: 7500, // High health, but no shield
    baseSpeed: 35, // Faster than Goliath
    baseReward: 600,
    radius: 22,
    color: "#4b0082", // Indigo
    glowColor: "#9400d3", // Dark Violet
    detailColor: "#50c878", // Emerald Green for corrupting energy
    livesPenalty: 20,
  },
  Juggernaut: {
    name: "Juggernaut",
    baseHp: 9000, // Very high health
    baseSpeed: 28, // Slow and steady
    baseReward: 700,
    radius: 32, // It's a big one
    color: "#4a4e69", // Gunmetal grey
    glowColor: "#fca311", // Fiery orange
    detailColor: "#9a8c98", // Lighter grey for details
    livesPenalty: 25,
    // --- Juggernaut's Unique Stats ---
    attackRange: 250, // Range of its turret
    attackDamage: 100, // Damage per shell
    attackRate: 0.7, // Shells per second
  },
  Basilisk: {
    name: "Basilisk",
    baseHp: 8000,
    baseSpeed: 45, // It's quite fast
    baseReward: 650,
    radius: 24,
    color: "#234F1E", // Dark forest green
    glowColor: "#ADFF2F", // Green-yellow glow
    detailColor: "#DAA520", // Golden scales/details
    livesPenalty: 20,
    // --- Basilisk's Unique Stats ---
    auraRange: 180, // The radius of its slowing aura
    slowFactor: 1,
  },
  // To add a new boss, just define its properties here.
};

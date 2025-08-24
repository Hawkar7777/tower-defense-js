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
  // To add a new boss, just define its properties here.
};

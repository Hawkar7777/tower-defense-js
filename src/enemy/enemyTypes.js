// src/enemy/enemyTypes.js

export const ENEMY_TYPES = {
  basic: {
    name: "Scout",
    baseHp: 100,
    baseSpeed: 50,
    baseReward: 8,
    radius: 12,
    color: "#7df",
    glowColor: "#48f",
    detailColor: "#5ac",
  },
  brute: {
    name: "Brute",
    baseHp: 180,
    baseSpeed: 40,
    baseReward: 15,
    radius: 16,
    color: "#f96",
    glowColor: "#f63",
    detailColor: "#d54",
  },
  swift: {
    name: "Swift",
    baseHp: 80,
    baseSpeed: 70,
    baseReward: 12,
    radius: 10,
    color: "#9f6",
    glowColor: "#6f3",
    detailColor: "#5d4",
  },
  elite: {
    name: "Elite",
    baseHp: 250,
    baseSpeed: 45,
    baseReward: 25,
    radius: 14,
    color: "#f6f",
    glowColor: "#c3f",
    detailColor: "#a3c",
  },
  sapper: {
    name: "Sapper",
    baseHp: 120,
    baseSpeed: 45,
    baseReward: 20,
    radius: 13,
    color: "#f4a261",
    glowColor: "#e76f51",
    detailColor: "#e9c46a",
    attackRange: 100,
    attackDamage: 15,
    attackRate: 0.8,
    isAttacker: true,
  },
  wraith: {
    name: "Wraith",
    baseHp: 150, // Moderately tanky so it can support for a while
    baseSpeed: 38, // Slow, as its role is to support, not rush
    baseReward: 22, // High reward for a high-priority target
    radius: 14,
    color: "#a0e0e0", // Ghostly teal
    glowColor: "#40ffff", // Bright cyan glow
    detailColor: "#ffffff", // White details
    isSupport: true, // A flag to identify its role
    shieldRange: 120, // How far it can project its shield
    shieldHp: 100, // The health of the shield it provides
    shieldCooldown: 5, // Time in seconds between shield casts
  },
  mimic: {
    name: "Mimic",
    baseHp: 350, // Very high health to make it a durable threat
    baseSpeed: 80, // The high speed it has AFTER transforming
    baseReward: 30,
    radius: 16, // Used for collision, not shape
    color: "#ae5a41", // Woody brown for the chest
    glowColor: "#ff40ff", // The menacing magenta glow of its true form
    detailColor: "#f0c04f", // Gold trim
    isMimic: true, // Special flag for the spawner
    // --- Unique Mimic Properties ---
    disguisedSpeed: 30, // The very slow speed of its disguise
    damageReduction: 0.75, // In disguised form, it ignores 75% of incoming damage
    damageThreshold: 100, // How much post-reduction damage it must take to transform
  },
  leech: {
    name: "Leech",
    baseHp: 180, // Medium health
    baseSpeed: 42, // Medium-slow speed
    baseReward: 25, // High reward because it's a high-priority threat
    radius: 10, // Used for collision, not shape
    color: "#5c8a5a", // Sickly green body
    glowColor: "#8e44ad", // Pulsating purple core/glow
    detailColor: "#3b593a", // Darker green for segments
    isLeech: true, // Special flag for the spawner
    // --- Unique Leech Properties ---
    drainRange: 80, // How close it needs to be to a tower to latch on
    drainDps: 15, // Drains 15 HP per second from the tower
    healMultiplier: 1.5, // Heals itself for 150% of the damage it deals
  },
};

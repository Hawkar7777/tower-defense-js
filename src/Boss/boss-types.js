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
    slowFactor: 0.3,
  },
  Marauder: {
    name: "Marauder",
    baseHp: 8500, // Tough, but not a full tank
    baseSpeed: 50, // Very fast to feel like a vehicle
    baseReward: 680,
    radius: 26, // A bit wider than it is tall
    color: "#7d5c3c", // Dusty, desert-camo brown
    glowColor: "#ff8c00", // Headlight/engine orange glow
    detailColor: "#333333", // Dark metal for gun and tires
    livesPenalty: 20,
    // --- Marauder's Unique Stats (like Juggernaut) ---
    attackRange: 250, // Range of its machine gun
    attackDamage: 15, // Low damage per bullet...
    attackRate: 5, // ...but a very high rate of fire
  },
  Scorcher: {
    name: "Scorcher",
    baseHp: 20000, // Heavier armor
    baseSpeed: 22, // Very slow and deliberate
    baseReward: 800,
    radius: 30, // It's a large, heavy chassis
    color: "#4b5320", // Olive drab green
    glowColor: "#ff6600", // Missile engine glow
    detailColor: "#2e3518", // Darker military green
    livesPenalty: 25,
    // --- Scorcher's Unique Stats ---
    attackRange: 350, // Long range missiles
    attackDamage: 500, // High explosive damage
    attackRate: 0.3, // Fires one missile every ~3 seconds
    aoeRadius: 80, // 80px explosion radius
  },
  Devastator: {
    name: "Devastator",
    baseHp: 9500, // Heavily armored Humvee chassis
    baseSpeed: 35, // Faster than a tank, but not a scout car
    baseReward: 850,
    radius: 28, // Hummers are wide
    color: "#c2b280", // Sandy tan color
    glowColor: "#ffae42", // Muzzle flash / heat glow
    detailColor: "#4d4d4d", // Dark grey for trim and weapon
    livesPenalty: 25,
    // --- Devastator's Unique Stats ---
    attackRange: 280,
    attackDamage: 12, // Low damage per bullet...
    attackRate: 15, // ...but an insane rate of fire
    burstDuration: 2, // Fires in a continuous 2-second burst
    spinUpTime: 0.75, // Takes 0.75s to spin up before firing
    cooldown: 3.5, // Time between bursts
  },
  Reaper: {
    name: "Reaper",
    baseHp: 14000, // Very high health, as it's a constant threat
    baseSpeed: 70, // Patrol speed in pixels per second
    baseReward: 1000,
    radius: 45, // It's a large helicopter
    color: "#4a4e69", // Dark gunmetal grey
    glowColor: "#ff4d4d", // Cockpit/engine glow
    detailColor: "#22252e", // Near-black for details
    livesPenalty: 50, // A huge penalty if it escapes
    // --- Reaper's Unique Stats ---
    patrolAltitude: 250, // The Y-coordinate it flies at
    machineGun: {
      damage: 10,
      rate: 8, // Fires 8 bullets per second
      burstTargets: 2, // Can shoot at 2 towers at once
      range: 300,
    },
    rocketSalvo: {
      damage: 250,
      aoeRadius: 90,
      cooldown: 8, // Fires a rocket every 8 seconds
    },
  },
  // To add a new boss, just define its properties here.
};

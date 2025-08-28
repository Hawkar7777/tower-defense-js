// ===== FILE: levels.js =====

export const levels = [
  // Level 1: A classic S-curve on a standard map. Rebalanced for beginners.
  {
    level: 1,
    mapFile: "./map/map11.tmj", // Use the .tmj file
    startMoney: 100000000, // Very generous for testing purposes
    startLives: 150,
    waves: [
      { count: 10, types: { swarmer: 1.0 } }, // Swarmers can be spawned independently for testing
      // --- Individual Regular Enemy Waves (count: 1 for each type) ---
      { count: 10, types: { basic: 1.0 } },
      { count: 10, types: { brute: 1.0 } },
      { count: 10, types: { swift: 1.0 } },
      { count: 10, types: { elite: 1.0 } },
      { count: 10, types: { sapper: 1.0 } },
      { count: 10, types: { wraith: 1.0 } },
      { count: 10, types: { mimic: 1.0 } },
      { count: 10, types: { leech: 1.0 } },
      { count: 10, types: { shifter: 1.0 } },
      { count: 10, types: { hive: 1.0 } },
      { count: 10, types: { specter: 1.0 } },
      { count: 10, types: { collector: 1.0 } },
      { count: 10, types: { disruptor: 1.0 } },

      // --- Individual Boss Waves (1 boss per wave) ---
      { boss: "Goliath" },
      { boss: "Phantom" },
      { boss: "Warlock" },
      { boss: "Juggernaut" },
      { boss: "Basilisk" },
      { boss: "Marauder" },
      { boss: "Scorcher" },
      { boss: "Devastator" },
      { boss: "Reaper" },
      { bosses: ["Reaper", "Devastator"] },

      // You can add more specific test waves here if needed,
      // for example, a wave with two specific bosses:
      // { bosses: ["Juggernaut", "Basilisk"] },
      // Or a boss with other enemies:
      // { count: 5, types: { boss: "Basilisk", basic: 0.5, swift: 0.5 } },
    ],
  },
  {
    level: 2,
    mapFile: "./map/map12.tmj", // Reusing map11.tmj for level 2 for now, or create a new map2.tmj
    startMoney: 12023230, // Slightly more money
    startLives: 40, // More livess
    waves: [
      { boss: "Phantom" }, // Wave 10
    ],
  },
  {
    level: 3,
    mapFile: "./map/map3.tmj", // Reusing map11.tmj for level 2 for now, or create a new map2.tmj
    startMoney: 12023230, // Slightly more money
    startLives: 40, // More livess
    waves: [{ boss: "Goliath" }],
  },
];

// ===== FILE: levels.js =====

// This array holds the configuration for all levels.
// You can now define custom waves for each level.
export const levels = [
  // Level 1: A classic S-curve on a standard map. Rebalanced for beginners.
  {
    level: 1,
    map: { width: 50, height: 25 },
    startMoney: 1000,
    startLives: 50, // Increased lives to be more forgiving
    path: (TILE, T_HALF, MAP_W, MAP_H) => [
      { x: 0, y: TILE * 5 + T_HALF },
      { x: MAP_W * 0.25, y: TILE * 5 + T_HALF },
      { x: MAP_W * 0.25, y: MAP_H * 0.75 },
      { x: MAP_W, y: MAP_H * 0.75 },
    ],
    waves: [
      { boss: "Goliath" }, // Wave 10
      { count: 10, types: { basic: 1.0 } }, // Wave 1: Only basic enemies
      { count: 12, types: { basic: 1.0 } }, // Wave 2: A few more basics
      { count: 15, types: { basic: 1.0 } }, // Wave 3
      { count: 18, types: { basic: 0.8, swift: 0.2 } }, // Wave 4: Introduce Swift
      { count: 20, types: { basic: 0.7, swift: 0.3 } }, // Wave 5
      { count: 15, types: { basic: 0.5, brute: 0.5 } }, // Wave 6: Introduce Brute
      { count: 18, types: { basic: 0.4, brute: 0.6 } }, // Wave 7
      { count: 20, types: { swift: 0.5, brute: 0.5 } }, // Wave 8: Mix of new types
      { count: 25, types: { basic: 0.3, brute: 0.5, swift: 0.2 } }, // Wave 9
    ],
  },
  {
    level: 2,
    map: { width: 30, height: 30 },
    startMoney: 1200, // Slightly more money
    startLives: 40, // More lives
    path: (TILE, T_HALF, MAP_W, MAP_H) => [
      { x: 0, y: MAP_H * 0.2 },
      { x: MAP_W * 0.8, y: MAP_H * 0.2 },
      { x: MAP_W * 0.8, y: MAP_H * 0.5 },
      { x: MAP_W * 0.2, y: MAP_H * 0.5 },
      { x: MAP_W * 0.2, y: MAP_H * 0.8 },
      { x: MAP_W, y: MAP_H * 0.8 },
    ],
    waves: [
      { boss: "Phantom" }, // Wave 10
      { count: 15, types: { basic: 1.0 } }, // Wave 1: Start simple
      { count: 18, types: { basic: 0.7, swift: 0.3 } }, // Wave 2
      { count: 20, types: { swift: 1.0 } }, // Wave 3: A wave of pure swift
      { count: 22, types: { basic: 0.5, brute: 0.5 } }, // Wave 4
      { count: 25, types: { brute: 0.6, swift: 0.4 } }, // Wave 5
      { count: 28, types: { brute: 0.8, swift: 0.2 } }, // Wave 6
      { count: 20, types: { elite: 1.0 } }, // Wave 7: Introduce Elite
      { count: 25, types: { brute: 0.5, elite: 0.5 } }, // Wave 8
      { count: 30, types: { swift: 0.5, elite: 0.5 } }, // Wave 9
    ],
  },
  {
    level: 3,
    startMoney: 1500, // More starting money
    startLives: 30,
    map: { width: 50, height: 30 },
    path: (TILE, T_HALF, MAP_W, MAP_H) => [
      { x: 0, y: TILE * 3 + T_HALF },
      { x: MAP_W * 0.2, y: TILE * 3 + T_HALF },
      { x: MAP_W * 0.2, y: MAP_H * 0.9 },
      { x: MAP_W * 0.8, y: MAP_H * 0.9 },
      { x: MAP_W * 0.8, y: TILE * 3 + T_HALF },
      { x: MAP_W, y: TILE * 3 + T_HALF },
    ],
    waves: [
      { boss: "Warlock" }, // Wave 10
      { count: 20, types: { basic: 0.5, swift: 0.5 } }, // Wave 1
      { count: 25, types: { basic: 0.8, brute: 0.2 } }, // Wave 2
      { count: 30, types: { brute: 0.6, swift: 0.4 } }, // Wave 3
      { count: 35, types: { basic: 0.3, brute: 0.7 } }, // Wave 4
      { count: 30, types: { swift: 0.7, elite: 0.3 } }, // Wave 5
      { count: 35, types: { elite: 0.5, brute: 0.5 } }, // Wave 6
      { count: 40, types: { elite: 0.3, brute: 0.7 } }, // Wave 7
      { count: 45, types: { basic: 0.1, brute: 0.4, swift: 0.2, elite: 0.3 } }, // Wave 8
      { count: 50, types: { elite: 0.5, brute: 0.25, swift: 0.25 } }, // Wave 9
    ],
  },
  {
    level: 4,
    map: { width: 60, height: 25 }, // A wider map
    startMoney: 2000,
    startLives: 25, // Slightly more lives
    path: (TILE, T_HALF, MAP_W, MAP_H) => [
      { x: TILE * 5 + T_HALF, y: -T_HALF },
      { x: TILE * 5 + T_HALF, y: MAP_H * 0.8 },
      { x: MAP_W - (TILE * 5 + T_HALF), y: MAP_H * 0.8 },
      { x: MAP_W - (TILE * 5 + T_HALF), y: TILE * 5 + T_HALF },
      { x: MAP_W + T_HALF, y: TILE * 5 + T_HALF },
    ],
    waves: [
      { boss: "Juggernaut" }, // Wave 10
      { count: 20, types: { basic: 0.5, brute: 0.5 } }, // Wave 1: Standard wave
      { count: 25, types: { swift: 0.6, brute: 0.4 } }, // Wave 2
      { count: 20, types: { sapper: 1.0 } }, // Wave 3: Introduce Sapper
      { count: 25, types: { basic: 0.7, sapper: 0.3 } }, // Wave 4
      { count: 30, types: { swift: 0.5, sapper: 0.5 } }, // Wave 5
      { count: 35, types: { brute: 0.7, sapper: 0.3 } }, // Wave 6
      { count: 40, types: { elite: 0.4, sapper: 0.6 } }, // Wave 7
      { count: 45, types: { brute: 0.3, elite: 0.3, sapper: 0.4 } }, // Wave 8
      { count: 50, types: { elite: 0.7, sapper: 0.3 } }, // Wave 9
    ],
  },
  {
    level: 5,
    map: { width: 40, height: 40 },
    startMoney: 2200,
    startLives: 25,
    path: (TILE, T_HALF, MAP_W, MAP_H) => [
      { x: 0, y: TILE * 5 + T_HALF },
      { x: MAP_W * 0.7, y: TILE * 5 + T_HALF },
      { x: MAP_W * 0.7, y: MAP_H * 0.7 },
      { x: MAP_W * 0.3, y: MAP_H * 0.7 },
      { x: MAP_W * 0.3, y: MAP_H },
    ],
    waves: [
      { boss: "Basilisk" },
      { count: 30, types: { basic: 0.5, swift: 0.5 } }, // Wave 1
      { count: 35, types: { brute: 0.6, swift: 0.4 } }, // Wave 2
      { count: 40, types: { basic: 0.3, brute: 0.5, sapper: 0.2 } }, // Wave 3
      { count: 35, types: { swift: 0.5, elite: 0.5 } }, // Wave 4: Heavy on elites and swifts
      { count: 40, types: { brute: 0.5, sapper: 0.5 } }, // Wave 5
      { count: 45, types: { elite: 0.6, swift: 0.4 } }, // Wave 6
      { count: 50, types: { brute: 0.4, elite: 0.4, sapper: 0.2 } }, // Wave 7: A tough mix
      { count: 55, types: { sapper: 0.5, elite: 0.5 } }, // Wave 8: High priority targets
      { count: 60, types: { brute: 0.3, swift: 0.3, elite: 0.4 } }, // Wave 9
    ],
  },
];

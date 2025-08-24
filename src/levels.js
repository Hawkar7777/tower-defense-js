// ===== FILE: levels.js =====

// This array holds the configuration for all levels.
// You can now define custom waves for each level.
export const levels = [
  // Level 1: A classic S-curve on a standard map.
  {
    level: 1,
    map: { width: 50, height: 25 },
    startMoney: 1000,
    startLives: 30,
    path: (TILE, T_HALF, MAP_W, MAP_H) => [
      { x: 0, y: TILE * 5 + T_HALF },
      { x: MAP_W * 0.25, y: TILE * 5 + T_HALF },
      { x: MAP_W * 0.25, y: MAP_H * 0.75 },
      { x: MAP_W, y: MAP_H * 0.75 },
    ],
    waves: [
      { count: 10, types: { sapper: 1.0 } },
      // Wave 1
      { count: 12, types: { basic: 1.0 } }, // Wave 2
      { count: 15, types: { basic: 0.8, brute: 0.2 } }, // Wave 3
      { count: 18, types: { basic: 0.7, brute: 0.3 } }, // Wave 4
      { count: 20, types: { basic: 0.5, brute: 0.3, swift: 0.2 } }, // Wave 5
      { count: 22, types: { basic: 0.4, brute: 0.4, swift: 0.2 } }, // Wave 6
      { count: 25, types: { brute: 0.5, swift: 0.5 } }, // Wave 7
      { count: 28, types: { basic: 0.2, brute: 0.4, swift: 0.3, elite: 0.1 } }, // Wave 8
      { count: 30, types: { brute: 0.5, swift: 0.2, elite: 0.3 } }, // Wave 9
      { boss: "Goliath" },
    ],
  },
  {
    level: 2,
    map: { width: 30, height: 30 },
    startMoney: 800,
    startLives: 20,
    path: (TILE, T_HALF, MAP_W, MAP_H) => [
      { x: 0, y: MAP_H * 0.2 },
      { x: MAP_W * 0.8, y: MAP_H * 0.2 },
      { x: MAP_W * 0.8, y: MAP_H * 0.5 },
      { x: MAP_W * 0.2, y: MAP_H * 0.5 },
      { x: MAP_W * 0.2, y: MAP_H * 0.8 },
      { x: MAP_W, y: MAP_H * 0.8 },
    ],
    waves: [
      { count: 15, types: { swift: 1.0 } }, // Wave 1
      { count: 20, types: { basic: 0.5, swift: 0.5 } }, // Wave 2
      { count: 25, types: { basic: 0.7, swift: 0.3 } }, // Wave 3
      { count: 25, types: { brute: 0.4, swift: 0.6 } }, // Wave 4
      { count: 30, types: { brute: 0.6, swift: 0.4 } }, // Wave 5
      { count: 30, types: { brute: 0.7, elite: 0.3 } }, // Wave 6
      { count: 35, types: { swift: 0.5, elite: 0.5 } }, // Wave 7
      { count: 40, types: { brute: 0.3, swift: 0.3, elite: 0.4 } }, // Wave 8
      { count: 45, types: { swift: 0.8, elite: 0.2 } }, // Wave 9
      { boss: "Phantom" },
    ],
  },
  {
    level: 3,
    startMoney: 800,
    startLives: 20,
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
      { count: 20, types: { basic: 1.0 } }, // Wave 1
      { count: 25, types: { basic: 0.8, brute: 0.2 } }, // Wave 2
      { count: 30, types: { basic: 0.6, brute: 0.4 } }, // Wave 3
      { count: 35, types: { brute: 0.5, swift: 0.5 } }, // Wave 4
      { count: 40, types: { basic: 0.3, brute: 0.3, swift: 0.4 } }, // Wave 5
      { count: 45, types: { elite: 0.2, swift: 0.8 } }, // Wave 6
      { count: 50, types: { elite: 0.3, brute: 0.7 } }, // Wave 7
      { count: 55, types: { basic: 0.1, brute: 0.4, swift: 0.2, elite: 0.3 } }, // Wave 8
      { count: 60, types: { elite: 0.5, brute: 0.25, swift: 0.25 } }, // Wave 9
      { boss: "Warlock" },
    ],
  },
];

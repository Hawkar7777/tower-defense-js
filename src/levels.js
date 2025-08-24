// levels.js

// This array will hold the configuration for all 30 levels.
export const levels = [
  // Level 1: A classic S-curve on a standard map.
  {
    level: 1,
    map: { width: 40, height: 25 },
    // The path is a function that receives dimensions to create a responsive path.
    path: (TILE, T_HALF, MAP_W, MAP_H) => [
      { x: 0, y: TILE * 4 + T_HALF },
      { x: MAP_W * 0.75, y: TILE * 4 + T_HALF },
      { x: MAP_W * 0.75, y: MAP_H * 0.8 },
      { x: MAP_W * 0.25, y: MAP_H * 0.8 },
      { x: MAP_W * 0.25, y: TILE * 12 + T_HALF },
      { x: MAP_W, y: TILE * 12 + T_HALF },
    ],
  },
  // Level 2: A smaller, more vertical map.
  {
    level: 2,
    map: { width: 30, height: 20 },
    path: (TILE, T_HALF, MAP_W, MAP_H) => [
      { x: TILE * 5 + T_HALF, y: 0 },
      { x: TILE * 5 + T_HALF, y: MAP_H * 0.4 },
      { x: MAP_W * 0.7, y: MAP_H * 0.4 },
      { x: MAP_W * 0.7, y: MAP_H },
    ],
  },
  // Level 3: A long, winding path on a large map.
  {
    level: 3,
    map: { width: 50, height: 30 },
    path: (TILE, T_HALF, MAP_W, MAP_H) => [
      { x: 0, y: TILE * 3 + T_HALF },
      { x: MAP_W * 0.2, y: TILE * 3 + T_HALF },
      { x: MAP_W * 0.2, y: MAP_H * 0.9 },
      { x: MAP_W * 0.8, y: MAP_H * 0.9 },
      { x: MAP_W * 0.8, y: TILE * 3 + T_HALF },
      { x: MAP_W, y: TILE * 3 + T_HALF },
    ],
  },
  // ... Additional unique level designs would go here.
];

// Auto-generate the remaining levels for demonstration purposes.
for (let i = 4; i <= 30; i++) {
  const width = 35 + Math.floor(Math.random() * 16); // width between 35-50
  const height = 22 + Math.floor(Math.random() * 9); // height between 22-30
  levels.push({
    level: i,
    map: { width, height },
    // A simple, randomized path generator for variety.
    path: (TILE, T_HALF, MAP_W, MAP_H) => {
      const y1 = (3 + (i % 6)) * TILE + T_HALF;
      const y2 = (height - 5 - (i % 5)) * TILE + T_HALF;
      const x1 = width * (0.6 + Math.random() * 0.25) * TILE;
      const x2 = width * (0.2 + Math.random() * 0.25) * TILE;
      return [
        { x: 0, y: y1 },
        { x: x1, y: y1 },
        { x: x1, y: y2 },
        { x: x2, y: y2 },
        { x: x2, y: MAP_H },
      ];
    },
  });
}

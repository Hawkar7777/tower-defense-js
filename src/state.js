// Central mutable state (exported as objects so imported modules can mutate properties)
export const state = {
  money: 200,
  lives: 20,
  wave: 0,
  time: 0,
  running: true,
};

export const enemies = [];
export const towers = [];
export const projectiles = [];
export const particles = [];
export const beams = [];
export const circles = [];
export const pulses = [];

// UI selections
export const ui = {
  selectedShopKey: "gun",
  hoveredTile: null,
  selectedTower: null,
};


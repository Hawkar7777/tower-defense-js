// state.js

// Central mutable state
export const state = {
  money: 0, // Initial value is now 0, will be set by level config
  lives: 0, // Initial value is now 0, will be set by level config
  wave: 0,
  time: 0,
  running: false,
  camera: { x: 0, y: 0 },
  zoom: 1,
};

// ... (enemies, towers, etc. remain the same) ...
export const enemies = [];
export const towers = [];
export const projectiles = [];
export const pulses = [];
export const particles = [];
export const beams = [];
export const circles = [];

// ... (ui state remains the same) ...
export const ui = {
  selectedShopKey: null,
  hoveredTile: null,
  selectedTower: null,
  heldTower: null,

  shopScrollOffset: 0,
  maxShopScroll: 0,
  inspectorButtons: null,
};

/**
 * --- MODIFIED FUNCTION ---
 * Resets the game state using parameters from a specific level's configuration.
 * @param {object} levelConfig - The configuration object for the level being started.
 */
export function resetState(levelConfig) {
  // Use the level configuration to set starting money and lives
  state.money = levelConfig.startMoney;
  state.lives = levelConfig.startLives;
  state.wave = 0;
  state.time = 0;
  state.running = true; // Set to true to allow the game loop to run
  state.camera = { x: 0, y: 0 };
  state.zoom = 1.0;

  // Clear all dynamic entity arrays
  towers.length = 0;
  enemies.length = 0;
  projectiles.length = 0;
  pulses.length = 0;

  // Reset UI selections to default
  ui.selectedTower = null;
  ui.selectedShopKey = null;
  ui.heldTower = null;
  ui.shopScrollOffset = 0;
  ui.inspectorButtons = null;
}

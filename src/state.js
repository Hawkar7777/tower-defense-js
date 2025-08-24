// state.js

// Central mutable state
export const state = {
  money: 10000, // Set to a reasonable starting value
  lives: 20,
  wave: 0,
  time: 0,
  running: false, // Start in a non-running state
  camera: {
    x: 0,
    y: 0,
  },
  zoom: 1,
};

// Dynamic game entities
export const enemies = [];
export const towers = [];
export const projectiles = [];
export const pulses = [];
// You can keep other arrays like particles if you use them elsewhere
export const particles = [];
export const beams = [];
export const circles = [];

// UI state
export const ui = {
  selectedShopKey: null, // Start with nothing selected
  hoveredTile: null,
  selectedTower: null,
  heldTower: null, // Add heldTower for consistency
  shopScrollOffset: 0,
  maxShopScroll: 0,
  inspectorButtons: null, // To hold button coordinates for clicks
};

/**
 * Resets the entire game state to its initial values.
 * This is called every time a new level is started.
 */
export function resetState() {
  state.money = 100000; // Initial money for a new level
  state.lives = 20;
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

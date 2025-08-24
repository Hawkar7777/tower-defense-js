import { towers } from "./state.js";
import { TOWER_TYPES } from "./config.js";
import { blocked } from "./path.js";
import { MAP_GRID_W, MAP_GRID_H } from "./core.js";

const occupiedCells = new Set();

export function updateOccupiedCells() {
  occupiedCells.clear();
  for (const tower of towers) {
    const spec = TOWER_TYPES[tower.key];
    if (!spec) {
      console.warn(`Tower with unknown key "${tower.key}" found.`);
      continue;
    }
    const cells = getOccupiedCells(tower.gx, tower.gy, spec.size);
    for (const cell of cells) {
      occupiedCells.add(`${cell.gx},${cell.gy}`);
    }
  }
}

/**
 * Calculates all grid cells occupied by a tower based on its center and size.
 * The size object can define multi-directional footprints.
 * @param {number} gx - The tower's center grid X coordinate.
 * @param {number} gy - The tower's center grid Y coordinate.
 * @param {object} size - The size object from the tower's config.
 *                        e.g., { align: "TBLR", occupy: 2 }
 * @returns {Array<{gx: number, gy: number}>} An array of occupied cells.
 */
export function getOccupiedCells(gx, gy, size) {
  // Default case for 1x1 towers or invalid size objects
  if (
    !size ||
    typeof size !== "object" ||
    !size.occupy ||
    size.occupy <= 1 ||
    !size.align
  ) {
    return [{ gx, gy }];
  }

  const cells = new Set();
  cells.add(`${gx},${gy}`); // The central cell is always occupied

  const extent = size.occupy - 1; // 'occupy: 2' means an extent of 1 cell from the center
  const align = size.align.toUpperCase();

  // Special case for full square/radial occupation like "TBLR"
  if (
    align.includes("T") &&
    align.includes("B") &&
    align.includes("L") &&
    align.includes("R")
  ) {
    for (let dx = -extent; dx <= extent; dx++) {
      for (let dy = -extent; dy <= extent; dy++) {
        cells.add(`${gx + dx},${gy + dy}`);
      }
    }
  } else {
    // Handle directional occupation (e.g., "LR", "T", "TB")
    for (let i = 1; i <= extent; i++) {
      if (align.includes("T")) cells.add(`${gx},${gy - i}`);
      if (align.includes("B")) cells.add(`${gx},${gy + i}`);
      if (align.includes("L")) cells.add(`${gx - i},${gy}`);
      if (align.includes("R")) cells.add(`${gx + i},${gy}`);
    }
  }

  // Convert the set of "x,y" strings back to an array of {gx, gy} objects
  return Array.from(cells).map((coord) => {
    const [x, y] = coord.split(",").map(Number);
    return { gx: x, gy: y };
  });
}

export function isPlacementValid(gx, gy, towerSpec) {
  const cellsToOccupy = getOccupiedCells(gx, gy, towerSpec.size);
  for (const cell of cellsToOccupy) {
    const isOccupied = occupiedCells.has(`${cell.gx},${cell.gy}`);
    const isOnPath = blocked.has(`${cell.gx},${cell.gy}`);
    const isOutOfBounds =
      cell.gx < 0 ||
      cell.gx >= MAP_GRID_W ||
      cell.gy < 0 ||
      cell.gy >= MAP_GRID_H - 2;
    if (isOccupied || isOnPath || isOutOfBounds) {
      return false;
    }
  }
  return true;
}

export function findTowerAt(gx, gy) {
  for (const t of towers) {
    const spec = TOWER_TYPES[t.key];
    if (!spec) continue;
    const occupied = getOccupiedCells(t.gx, t.gy, spec.size);
    if (occupied.some((cell) => cell.gx === gx && cell.gy === gy)) {
      return t;
    }
  }
  return null;
}

updateOccupiedCells();

// src/map/mapRenderer.js
import { TILE, ctx, DPR } from "../core.js";

let currentMapData = null;
const tileImages = new Map(); // Stores Image objects keyed by their 'firstgid'

// Function to load a single tile image
async function loadTileImage(imagePath) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imagePath;
  });
}

// Loads the Tiled JSON map and all associated tile images
export async function loadMap(mapFileUrl) {
  try {
    const response = await fetch(mapFileUrl);
    if (!response.ok) {
      throw new Error(`Failed to load map file: ${mapFileUrl}`);
    }
    const mapData = await response.json();
    currentMapData = mapData;

    tileImages.clear(); // Clear previous images
    // Load all tileset images
    const imagePromises = mapData.tilesets.map(async (tileset) => {
      // Assuming images are in the same directory as the map file or relative to it
      // Adjust path if needed, e.g., `url.substring(0, url.lastIndexOf('/')) + '/' + tileset.image`
      const img = await loadTileImage(`./map/${tileset.image}`);
      tileImages.set(tileset.firstgid, { img, tileset }); // Store with firstgid for easy lookup
    });
    await Promise.all(imagePromises);

    return mapData;
  } catch (error) {
    console.error("Error loading map:", error);
    currentMapData = null;
    tileImages.clear();
    throw error;
  }
}

// Function to get blocked cells from the map data
// Assuming 'Tile Layer 2' (tileset 'road') represents the path and thus blocked for towers
export function getBlockedCellsFromMap() {
  const blockedTiles = new Set();
  if (!currentMapData) return blockedTiles;

  const roadLayer = currentMapData.layers.find(
    (layer) => layer.name === "Tile Layer 2" && layer.type === "tilelayer"
  );

  if (roadLayer && roadLayer.data) {
    const mapWidth = currentMapData.width;
    for (let i = 0; i < roadLayer.data.length; i++) {
      const tileId = roadLayer.data[i];
      if (tileId !== 0) {
        // If it's not an empty tile
        const gx = i % mapWidth;
        const gy = Math.floor(i / mapWidth);
        blockedTiles.add(`${gx},${gy}`);
      }
    }
  }
  return blockedTiles;
}

// Function to get the path points from the map data
// This will trace the 'road' tiles from left to right, then down/up, then right again
export function getPathFromMap() {
  if (!currentMapData) return [];

  const roadLayer = currentMapData.layers.find(
    (layer) => layer.name === "Tile Layer 2" && layer.type === "tilelayer"
  );

  if (!roadLayer || !roadLayer.data) return [];

  const mapWidth = currentMapData.width;
  const mapHeight = currentMapData.height;

  let startTile = null;
  // Find a starting road tile, prioritizing left edge
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      if (roadLayer.data[y * mapWidth + x] !== 0) {
        startTile = { x: x, y: y };
        break;
      }
    }
    if (startTile) break;
  }

  if (!startTile) {
    console.warn("Could not find a starting path tile on the map.");
    return [];
  }

  const actualPathPoints = [];
  let currentX = startTile.x;
  let currentY = startTile.y;
  let prevX = -1; // Keep track of previous tile to avoid backtracking immediately
  let prevY = -1;
  const visitedPathTrace = new Set();

  // Directions: Right, Down, Up, Left
  const directions = [
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: -1, dy: 0 },
  ];

  while (true) {
    const key = `${currentX},${currentY}`;
    if (visitedPathTrace.has(key)) {
      // If we've visited this tile before, we've either completed a loop
      // or reached a dead end/finished path. Break.
      break;
    }
    visitedPathTrace.add(key);
    actualPathPoints.push({
      x: currentX * TILE + TILE / 2,
      y: currentY * TILE + TILE / 2,
    });

    let nextTile = null;
    let foundNext = false;

    // Try to find the next path tile
    for (const dir of directions) {
      const nx = currentX + dir.dx;
      const ny = currentY + dir.dy;

      // Ensure neighbor is within bounds
      if (nx >= 0 && nx < mapWidth && ny >= 0 && ny < mapHeight) {
        // Ensure neighbor is not the previous tile
        if (nx === prevX && ny === prevY) continue;

        const tileIndex = ny * mapWidth + nx;
        const tileId = roadLayer.data[tileIndex];

        if (tileId !== 0) {
          // If it's a road tile
          nextTile = { x: nx, y: ny };
          foundNext = true;
          break; // Found the next path segment, prioritize this direction
        }
      }
    }

    if (!foundNext) {
      // If no new path tile is found, it's the end of the path
      break;
    }

    prevX = currentX;
    prevY = currentY;
    currentX = nextTile.x;
    currentY = nextTile.y;
  }

  return actualPathPoints;
}

// Renders the current map to the canvas
export function drawMap(camera, zoom) {
  if (!currentMapData) return;

  const tileWidth = currentMapData.tilewidth;
  const tileHeight = currentMapData.tileheight;
  const mapWidth = currentMapData.width;
  const mapHeight = currentMapData.height;

  // Calculate visible area in world coordinates
  const viewPortX = camera.x;
  const viewPortY = camera.y;
  const viewPortW = ctx.canvas.clientWidth / zoom;
  const viewPortH = ctx.canvas.clientHeight / zoom;

  // Determine which tiles are visible on screen
  const startTileX = Math.floor(viewPortX / tileWidth);
  const startTileY = Math.floor(viewPortY / tileHeight);
  const endTileX = Math.ceil((viewPortX + viewPortW) / tileWidth);
  const endTileY = Math.ceil((viewPortY + viewPortH) / tileHeight);

  for (const layer of currentMapData.layers) {
    if (layer.type === "tilelayer" && layer.visible) {
      const tilesetLookup = new Map(); // map globalTileId to {image, tileset}
      for (const tsConfig of currentMapData.tilesets) {
        const imageInfo = tileImages.get(tsConfig.firstgid);
        if (imageInfo) {
          // Map all GIDs for this tileset to its image
          for (
            let id = tsConfig.firstgid;
            id < tsConfig.firstgid + tsConfig.tilecount;
            id++
          ) {
            tilesetLookup.set(id, imageInfo.img);
          }
        }
      }

      for (let gy = startTileY; gy < endTileY; gy++) {
        for (let gx = startTileX; gx < endTileX; gx++) {
          if (gx < 0 || gx >= mapWidth || gy < 0 || gy >= mapHeight) continue;

          const tileIndex = gy * mapWidth + gx;
          const tileId = layer.data[tileIndex];

          if (tileId !== 0) {
            // 0 is an empty tile
            const imageToDraw = tilesetLookup.get(tileId);
            if (imageToDraw) {
              const drawX = gx * tileWidth;
              const drawY = gy * tileHeight;
              ctx.drawImage(imageToDraw, drawX, drawY, tileWidth, tileHeight);
            } else {
              console.warn(
                `Tile ID ${tileId} in layer '${layer.name}' has no associated image.`
              );
            }
          }
        }
      }
    }
  }
}

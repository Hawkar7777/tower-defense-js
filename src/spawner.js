import { enemies, state } from "./state.js";
import { Enemy } from "./entities.js";
import { pointAt, totalLen } from "./path.js";
import { pulse } from "./utils.js";

let spawnTimer = 0;
let toSpawn = 0;
let tier = 0;

export function startNextWave() {
  state.wave++;
  toSpawn = 8 + state.wave * 2;
  spawnTimer = 0;
  tier = Math.floor((state.wave - 1) / 1.5);
  pulse(`Wave ${state.wave}!`, "#adf");
}

export function spawner(dt) {
  if (toSpawn <= 0) {
    if (enemies.length === 0) startNextWave();
    return;
  }
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    enemies.push(new Enemy(tier));
    spawnTimer = Math.max(0.25, 0.9 - state.wave * 0.03);
    toSpawn--;
  }
}


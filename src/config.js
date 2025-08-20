// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\config.js =====

import { GunTower } from "./towers/GunTower.js";
import { CannonTower } from "./towers/CannonTower.js";
import { DoubleCannonTower } from "./towers/DoubleCannonTower.js";
import { LaserTower } from "./towers/LaserTower.js";
import { IceTower } from "./towers/IceTower.js";
import { TeslaTower } from "./towers/TeslaTower.js";

export const TOWER_TYPES = {
  gun: {
    name: "Gunner",
    cost: 80,
    range: 120,
    fireRate: 6,
    dmg: 12,
    bulletSpeed: 340,
    color: "#6cf",
    class: GunTower,
  },
  cannon: {
    name: "Cannon",
    cost: 120,
    range: 140,
    fireRate: 1.2,
    dmg: 55,
    splash: 60,
    bulletSpeed: 260,
    color: "#f6c66a",
    class: CannonTower,
  },
  doubleCanon: {
    name: "Double Canon",
    cost: 160,
    range: 120,
    fireRate: 0.9,
    dmg: 75,
    splash: 55,
    bulletSpeed: 240,
    color: "#f00",
    class: DoubleCannonTower,
  },
  laser: {
    name: "Laser",
    cost: 250,
    range: 150,
    fireRate: 12,
    dmg: 5,
    beam: true,
    color: "#ff69e0",
    class: LaserTower,
  },
  ice: {
    // Add Ice Tower
    name: "Ice Tower",
    cost: 180,
    range: 130,
    fireRate: 2.5,
    dmg: 8,
    slowAmount: 0.6,
    slowDuration: 3,
    freezeChance: 0.2,
    bulletSpeed: 300,
    color: "#6cfaff",
    class: IceTower,
  },
  tesla: {
    name: "Tesla Tower",
    cost: 220,
    range: 140,
    fireRate: 1.8,
    dmg: 25,
    chainCount: 3, // Jumps to 3 additional targets
    chainRange: 80, // Range for chain jumps
    stunChance: 0.1, // 30% chance to stun
    stunDuration: 1, // seconds
    color: "#9d4edd",
    class: TeslaTower,
  },
};

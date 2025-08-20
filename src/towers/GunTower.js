// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\GunTower.js =====

import { BaseTower } from "./BaseTower.js";

export class GunTower extends BaseTower {
  static SPEC = {
    name: "Gunner",
    cost: 80,
    range: 120,
    fireRate: 6,
    dmg: 12,
    bulletSpeed: 340,
    color: "#6cf",
  };
}

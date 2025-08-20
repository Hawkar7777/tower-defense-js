// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\CannonTower.js =====

import { BaseTower } from "./BaseTower.js";

export class CannonTower extends BaseTower {
  static SPEC = {
    name: "Cannon",
    cost: 120,
    range: 140,
    fireRate: 1.2,
    dmg: 55,
    splash: 60,
    bulletSpeed: 260,
    color: "#f6c66a",
  };
}

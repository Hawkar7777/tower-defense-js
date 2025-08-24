import { BaseTower } from "./BaseTower.js";
import { Bullet } from "../bullet.js";
import { projectiles } from "../state.js";
import { findTarget } from "../utils.js"; // You likely have a function for this

export class GunTower extends BaseTower {
  constructor(gx, gy, key) {
    // This is the most important line.
    // It calls the BaseTower's constructor with the necessary information.
    super(gx, gy, key);
  }

  // Each tower needs its own logic for finding targets and firing.
  // This is a typical example for a GunTower.
  update(dt, enemies) {
    // This runs the cooldown logic from BaseTower
    super.update(dt, enemies);

    if (this.cooldown <= 0) {
      const spec = this.spec();
      const target = findTarget(this.center, spec.range, enemies);

      if (target) {
        // Reset cooldown and fire a projectile
        this.cooldown = 1 / spec.fireRate;
        projectiles.push(
          new Bullet(
            this.center,
            target,
            spec.dmg,
            spec.bulletSpeed,
            spec.color
          )
        );
      }
    }
  }
}

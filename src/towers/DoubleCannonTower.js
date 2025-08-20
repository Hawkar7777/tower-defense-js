// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\DoubleCannonTower.js =====

import { BaseTower } from "./BaseTower.js";
import { projectiles } from "../state.js";
import { spawnMuzzle } from "../effects.js";
import { roundRect } from "../helpers.js";
import { Bullet } from "../bullet.js";
import { ctx } from "../core.js";

export class DoubleCannonTower extends BaseTower {
  static SPEC = {
    name: "Double Canon",
    cost: 160,
    range: 120,
    fireRate: 0.9,
    dmg: 75,
    splash: 55,
    bulletSpeed: 240,
    color: "#f00",
  };

  fireProjectile(center, target, spec) {
    const offset = 6; // pixels from center
    const sin = Math.sin(this.rot);
    const cos = Math.cos(this.rot);

    // left barrel
    projectiles.push(
      new Bullet(center.x - sin * offset, center.y + cos * offset, target, spec)
    );

    // right barrel
    projectiles.push(
      new Bullet(center.x + sin * offset, center.y - cos * offset, target, spec)
    );

    spawnMuzzle(
      center.x - sin * offset,
      center.y + cos * offset,
      this.rot,
      spec.color
    );
    spawnMuzzle(
      center.x + sin * offset,
      center.y - cos * offset,
      this.rot,
      spec.color
    );
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;

    roundRect(x - 16, y - 16, 32, 32, 8, "#0e1626", true, "#223c62");

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);
    ctx.fillStyle = s.color;

    // Draw two barrels
    const offset = 6;
    roundRect(-8 - offset, -8, 16, 16, 4, s.color, true);
    roundRect(-8 + offset, -8, 16, 16, 4, s.color, true);

    ctx.fillStyle = "#fff";
    ctx.fillRect(0 - offset, -3, 14, 6); // left muzzle indicator
    ctx.fillRect(0 + offset, -3, 14, 6); // right muzzle indicator
    ctx.restore();

    for (let i = 0; i < this.level; i++) {
      ctx.fillStyle = s.color;
      ctx.fillRect(x - 10 + i * 6, y + 18, 4, 4);
    }
  }
}

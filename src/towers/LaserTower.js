// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\LaserTower.js =====

import { BaseTower } from "./BaseTower.js";
import { spawnBeam } from "../effects.js";
import { roundRect } from "../helpers.js";
import { ctx } from "../core.js";

export class LaserTower extends BaseTower {
  static SPEC = {
    name: "Laser",
    cost: 250,
    range: 150,
    fireRate: 12,
    dmg: 5,
    beam: true,
    color: "#ff69e0",
  };

  fireBeam(start, end, color) {
    spawnBeam(start, end, color);
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;

    roundRect(x - 16, y - 16, 32, 32, 8, "#0e1626", true, "#223c62");

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);
    ctx.fillStyle = s.color;

    // Laser emitter
    roundRect(-8, -8, 16, 16, 4, s.color, true);

    // Laser focus crystal
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(12, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    for (let i = 0; i < this.level; i++) {
      ctx.fillStyle = s.color;
      ctx.fillRect(x - 10 + i * 6, y + 18, 4, 4);
    }
  }
}

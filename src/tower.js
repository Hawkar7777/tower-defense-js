import { ctx } from "./core.js";
import { dist } from "./utils.js";
import { spawnMuzzle, spawnBeam } from "./effects.js";
import { projectiles } from "./state.js";
import { TOWER_TYPES } from "./config.js";
import { Bullet } from "./bullet.js";
import { roundRect } from "./helpers.js";

export class Tower {
  constructor(gx, gy, key) {
    this.gx = gx;
    this.gy = gy;
    this.key = key;
    this.level = 1;
    this.cool = 0;
    this.rot = 0;
  }

  spec() {
    const base = TOWER_TYPES[this.key];
    const mult = 1 + (this.level - 1) * 0.35;
    return {
      name: base.name,
      range: base.range * (1 + (this.level - 1) * 0.08),
      fireRate: base.fireRate * (1 + (this.level - 1) * 0.05),
      dmg: base.dmg * mult,
      bulletSpeed: base.bulletSpeed,
      splash: base.splash || 0,
      beam: base.beam || false,
      color: base.color,
      cost: base.cost,
    };
  }

  get center() {
    return { x: this.gx * 40 + 20, y: this.gy * 40 + 20 };
  }

  upgradeCost() {
    return Math.round(this.spec().cost * (0.75 + this.level * 0.75));
  }

  sellValue() {
    return this.spec().cost * 0.7 + (this.level - 1) * this.spec().cost * 0.35;
  }

  update(dt, enemiesList) {
    const s = this.spec();
    this.cool -= dt;
    let best = null,
      bestScore = -1;

    for (const e of enemiesList) {
      if (e.dead) continue;
      const p = e.pos;
      const d = dist(this.center, p);
      if (d <= s.range && e.t > bestScore) {
        best = e;
        bestScore = e.t;
      }
    }

    if (!best) return;
    const c = this.center,
      bp = best.pos;
    this.rot = Math.atan2(bp.y - c.y, bp.x - c.x);

    if (s.beam) {
      const dps = s.dmg * 60;
      if (this.cool <= 0) {
        best.damage(dps * dt);
        spawnBeam(c, bp, s.color);
      }
      return;
    }

    if (this.cool <= 0) {
      this.cool = 1 / s.fireRate;

      // Check for double cannon
      if (this.key === "doubleCanon") {
        const offset = 6; // pixels from center
        const sin = Math.sin(this.rot);
        const cos = Math.cos(this.rot);
        // left barrel
        projectiles.push(
          new Bullet(c.x - sin * offset, c.y + cos * offset, best, s)
        );
        // right barrel
        projectiles.push(
          new Bullet(c.x + sin * offset, c.y - cos * offset, best, s)
        );
        spawnMuzzle(c.x - sin * offset, c.y + cos * offset, this.rot, s.color);
        spawnMuzzle(c.x + sin * offset, c.y - cos * offset, this.rot, s.color);
      } else {
        projectiles.push(new Bullet(c.x, c.y, best, s));
        spawnMuzzle(c.x, c.y, this.rot, s.color);
      }
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;

    roundRect(x - 16, y - 16, 32, 32, 8, "#0e1626", true, "#223c62");

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);
    ctx.fillStyle = s.color;

    if (this.key === "doubleCanon") {
      // draw two barrels
      const offset = 6;
      roundRect(-8 - offset, -8, 16, 16, 4, s.color, true);
      roundRect(-8 + offset, -8, 16, 16, 4, s.color, true);
    } else {
      roundRect(-8, -8, 16, 16, 4, s.color, true);
    }

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, -3, 14, 6); // muzzle indicator
    ctx.restore();

    for (let i = 0; i < this.level; i++) {
      ctx.fillStyle = s.color;
      ctx.fillRect(x - 10 + i * 6, y + 18, 4, 4);
    }
  }
}

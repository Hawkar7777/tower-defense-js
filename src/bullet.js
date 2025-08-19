import { ctx } from "./core.js";
import { dist } from "./utils.js";
import { enemies } from "./state.js";
import { spawnExplosion, spawnHit } from "./effects.js";

export class Bullet {
  constructor(x, y, target, spec) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.speed = spec.bulletSpeed;
    this.dmg = spec.dmg;
    this.splash = spec.splash || 0;
    this.color = spec.color;
    this.dead = false;
  }

  update(dt) {
    if (!this.target || this.target.dead) {
      this.dead = true;
      return;
    }

    const tp = this.target.pos;
    const a = Math.atan2(tp.y - this.y, tp.x - this.x);
    const vx = Math.cos(a) * this.speed,
      vy = Math.sin(a) * this.speed;
    this.x += vx * dt;
    this.y += vy * dt;

    if (Math.hypot(tp.x - this.x, tp.y - this.y) < 10) {
      if (this.splash > 0) {
        for (const e of enemies) {
          const d = dist({ x: this.x, y: this.y }, e.pos);
          if (d <= this.splash) e.damage(this.dmg * (1 - d / this.splash));
        }
        spawnExplosion(this.x, this.y, this.splash, this.color);
      } else {
        this.target.damage(this.dmg);
        spawnHit(this.x, this.y, this.color);
      }
      this.dead = true;
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===== FILE: src/towers/WindTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, particles } from "../state.js";
import { dist } from "../utils.js";

export class WindTower extends BaseTower {
  static SPEC = {
    name: "Wind Tower",
    cost: 200,
    range: 140,
    fireRate: 1.2, // attacks per second
    knockback: 40, // pixels
    slowAmount: 0.5, // slows enemies by 50% for a short duration
    slowDuration: 1.5, // seconds
    color: "#00bfff",
  };

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.25;
    return {
      ...base,
      knockback: base.knockback * mult,
      slowAmount: base.slowAmount * (1 + (this.level - 1) * 0.05),
      range: base.range * (1 + (this.level - 1) * 0.1),
    };
  }

  getAttackOrigin() {
    return { x: this.center.x, y: this.center.y - 10 };
  }

  update(dt, enemiesList) {
    const s = this.spec();
    this.cool -= dt;

    if (this.cool <= 0) {
      let hitAny = false;

      for (const e of enemiesList) {
        if (e.dead) continue;
        const d = dist(this.center, e.pos);
        if (d <= s.range) {
          hitAny = true;

          // Apply knockback
          const dx = e.pos.x - this.center.x;
          const dy = e.pos.y - this.center.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          e.pos.x += (dx / len) * s.knockback;
          e.pos.y += (dy / len) * s.knockback;

          // Initialize original speed if not set
          if (e.originalSpeed === undefined) e.originalSpeed = e.speed;

          // Apply temporary slow
          e.slowedUntil = performance.now() + s.slowDuration * 1000;
          e.speed = e.originalSpeed * (1 - s.slowAmount);

          // Particles for wind gust
          for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 60 + 20;
            particles.push({
              x: e.pos.x,
              y: e.pos.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 0.4,
              r: 2 + Math.random() * 2,
              c: "#a0e7ff",
              fade: 0.9,
            });
          }
        }

        // Restore speed if slow duration expired
        if (e.slowedUntil && e.slowedUntil < performance.now()) {
          e.speed = e.originalSpeed;
          e.slowedUntil = null;
        }
      }

      if (hitAny) {
        this.cool = 1 / s.fireRate;
      }
    }
  }

  draw() {
    const { x, y } = this.center;
    const time = performance.now() / 500;

    // Tower base
    ctx.fillStyle = "#0080ff";
    ctx.beginPath();
    ctx.arc(x, y + 6, 14, 0, Math.PI * 2);
    ctx.fill();

    // Tower body
    ctx.fillStyle = "#00bfff";
    ctx.beginPath();
    ctx.rect(x - 6, y - 16, 12, 22);
    ctx.fill();

    // Wind blades on top
    const bladeCount = 3;
    for (let i = 0; i < bladeCount; i++) {
      const angle = time + (i * (2 * Math.PI)) / bladeCount;
      const px = x + Math.cos(angle) * 10;
      const py = y - 18 + Math.sin(angle) * 6;
      ctx.strokeStyle = "#a0e7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(px, py);
      ctx.stroke();
    }

    // Level indicators
    for (let i = 0; i < this.level; i++) {
      const ix = x - 10 + i * 5;
      const iy = y + 20;
      ctx.strokeStyle = "#a0e7ff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(ix, iy + 4);
      ctx.stroke();
    }
  }
}

// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\bullet.js =====

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

    // Ice properties (will be undefined for non-ice bullets)
    this.isIce = spec.isIce;
    this.slowAmount = spec.slowAmount;
    this.slowDuration = spec.slowDuration;
    this.freezeChance = spec.freezeChance;
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

        // Apply ice effects if this is an ice bullet
        if (this.isIce) {
          this.applyIceEffect(this.target);
        }

        spawnHit(this.x, this.y, this.color);
      }
      this.dead = true;
    }
  }

  applyIceEffect(enemy) {
    // Apply slow effect
    if (enemy.slowEffect) {
      // Refresh duration if already slowed
      enemy.slowEffect.duration = this.slowDuration;
    } else {
      // Create new slow effect
      enemy.slowEffect = {
        originalSpeed: enemy.speed,
        amount: this.slowAmount,
        duration: this.slowDuration,
      };
      enemy.speed *= 1 - this.slowAmount;
    }

    // Apply freeze chance
    if (Math.random() < this.freezeChance && !enemy.frozen) {
      enemy.frozen = true;
      enemy.speed = 0;

      // Set timeout to unfreeze
      setTimeout(() => {
        if (!enemy.dead) {
          enemy.frozen = false;
          enemy.speed = enemy.slowEffect
            ? enemy.slowEffect.originalSpeed * (1 - enemy.slowEffect.amount)
            : enemy.slowEffect.originalSpeed;
        }
      }, this.slowDuration * 500); // Freeze for half the slow duration
    }

    // Visual ice effect on enemy
    enemy.iceEffect = true;
    enemy.iceEffectTime = this.slowDuration;
  }

  draw() {
    ctx.fillStyle = this.color;

    // Different appearance for ice bullets
    if (this.isIce) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ice crystal effect
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 5);
      ctx.lineTo(this.x + 3.5, this.y);
      ctx.lineTo(this.x, this.y + 5);
      ctx.lineTo(this.x - 3.5, this.y);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

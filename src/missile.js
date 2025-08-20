// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\missile.js =====

import { ctx } from "./core.js";
import { dist } from "./utils.js";
import { enemies } from "./state.js";
import { spawnExplosion } from "./effects.js";
import { particles } from "./state.js";

export class Missile {
  constructor(x, y, target, spec, initialRotation = null) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.speed = spec.bulletSpeed;
    this.dmg = spec.dmg;
    this.splash = spec.splash;
    this.homingStrength = spec.homingStrength;
    this.retarget = spec.retarget;
    this.color = spec.color;
    this.dead = false;

    // Use provided rotation or calculate from target
    this.rotation =
      initialRotation !== null
        ? initialRotation
        : Math.atan2(target.pos.y - y, target.pos.x - x);

    this.trailParticles = [];
    this.smokeTimer = 0;
  }

  update(dt) {
    // Handle target death and retargeting
    if (!this.target || this.target.dead) {
      if (this.retarget) {
        this.findNewTarget();
        if (!this.target) {
          this.dead = true;
          return;
        }
      } else {
        this.dead = true;
        return;
      }
    }

    // Homing behavior
    const tp = this.target.pos;
    const desiredAngle = Math.atan2(tp.y - this.y, tp.x - this.x);
    const angleDiff =
      ((desiredAngle - this.rotation + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    this.rotation += angleDiff * this.homingStrength;

    // Movement
    this.x += Math.cos(this.rotation) * this.speed * dt;
    this.y += Math.sin(this.rotation) * this.speed * dt;

    // Smoke trail
    this.smokeTimer -= dt;
    if (this.smokeTimer <= 0) {
      this.spawnSmokeTrail();
      this.smokeTimer = 0.05;
    }

    // Collision detection
    if (this.target && !this.target.dead) {
      const d = dist({ x: this.x, y: this.y }, this.target.pos);
      if (d < 15) {
        this.explode();
        this.dead = true;
      }
    }
  }

  findNewTarget() {
    let closest = null;
    let closestDist = Infinity;

    for (const e of enemies) {
      if (e.dead) continue;
      const d = dist({ x: this.x, y: this.y }, e.pos);
      if (d < closestDist) {
        closest = e;
        closestDist = d;
      }
    }

    this.target = closest;
  }

  explode() {
    // Main explosion
    spawnExplosion(this.x, this.y, this.splash, this.color);

    // Damage all enemies in splash radius
    for (const e of enemies) {
      if (e.dead) continue;
      const d = dist({ x: this.x, y: this.y }, e.pos);
      if (d <= this.splash) {
        const damageFactor = 1 - d / this.splash;
        e.damage(this.dmg * damageFactor);
      }
    }
  }

  spawnSmokeTrail() {
    for (let i = 0; i < 2; i++) {
      const angle = this.rotation + Math.PI + (Math.random() - 0.5) * 0.3;
      const speed = 20 + Math.random() * 30;
      const size = 2 + Math.random() * 2;
      const life = 0.8 + Math.random() * 0.4;

      particles.push({
        x: this.x - Math.cos(this.rotation) * 5,
        y: this.y - Math.sin(this.rotation) * 5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        r: size,
        c: i === 0 ? "#888888" : "#FF5722", // Gray smoke and orange fire
        gravity: -0.05, // Smoke rises slightly
        fade: 0.93,
        shrink: 0.96,
      });
    }
  }

  draw() {
    // Draw smoke trail
    for (let i = 0; i < Math.min(10, this.trailParticles.length); i++) {
      const p = this.trailParticles[i];
      ctx.globalAlpha = p.life * 1.2;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw missile
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Missile body
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(-6, -3, 12, 6, 2);
    ctx.fill();

    // Orange stripes
    ctx.fillStyle = this.color;
    ctx.fillRect(-4, -3, 8, 1);
    ctx.fillRect(-4, 2, 8, 1);

    // Nose cone
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(6, -3);
    ctx.lineTo(6, 3);
    ctx.lineTo(10, 0);
    ctx.closePath();
    ctx.fill();

    // Fins
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(-6, -3);
    ctx.lineTo(-8, -5);
    ctx.lineTo(-6, -1);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-6, 3);
    ctx.lineTo(-8, 5);
    ctx.lineTo(-6, 1);
    ctx.closePath();
    ctx.fill();

    // Engine exhaust
    ctx.fillStyle = "#FF9800";
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-6, 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// Add roundRect polyfill if needed
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x,
    y,
    width,
    height,
    radius
  ) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;

    this.beginPath();
    this.moveTo(x + radius, y);
    this.arcTo(x + width, y, x + width, y + height, radius);
    this.arcTo(x + width, y + height, x, y + height, radius);
    this.arcTo(x, y + height, x, y, radius);
    this.arcTo(x, y, x + width, y, radius);
    this.closePath();
    return this;
  };
}

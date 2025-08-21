import { ctx } from "./core.js";
import { enemies, particles } from "./state.js";
import { dist } from "./utils.js";

export class ArrowProjectile {
  constructor(startX, startY, target, spec) {
    this.x = startX;
    this.y = startY;
    this.startX = startX;
    this.startY = startY;
    this.target = target;
    this.spec = spec;

    this.angle = Math.atan2(target.pos.y - startY, target.pos.x - startX);
    this.totalDistance = dist({ x: startX, y: startY }, target.pos);
    this.traveled = 0;

    this.active = true;
    this.exploded = false; // Use exploded to handle damage once
  }

  update(dt) {
    if (!this.active) return;

    const speed = this.spec.bulletSpeed * dt;
    this.traveled += speed;

    const progress = this.traveled / this.totalDistance;

    // Update position linearly
    this.x = this.startX + Math.cos(this.angle) * this.traveled;
    this.y = this.startY + Math.sin(this.angle) * this.traveled;

    // If arrow reached target point OR progress >= 1, apply damage
    if (progress >= 1 && !this.exploded) {
      this.exploded = true;
      this.active = false;

      // Damage the target if still alive
      if (!this.target.dead) {
        const damage =
          Math.random() < this.spec.critChance
            ? this.spec.dmg * this.spec.critMultiplier
            : this.spec.dmg;
        this.target.damage(damage);
      }

      // Optional hit particles
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: this.x,
          y: this.y,
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30,
          life: 0.3 + Math.random() * 0.2,
          r: 2,
          c: this.spec.color,
        });
      }
    }
  }

  draw() {
    if (!this.active) return;

    ctx.strokeStyle = this.spec.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(
      this.x - Math.cos(this.angle) * 8,
      this.y - Math.sin(this.angle) * 8
    );
    ctx.stroke();
  }
}

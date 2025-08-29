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

      if (!this.target.dead) {
        // --- CRIT CHECK ---
        const isCrit = Math.random() < this.spec.critChance;
        const damage = isCrit
          ? this.spec.dmg * this.spec.critMultiplier
          : this.spec.dmg;

        this.target.damage(damage);

        // Floating text for crits (could store on target or particles system)
        if (isCrit) {
          particles.push({
            x: this.target.pos.x,
            y: this.target.pos.y - 15,
            vx: 0,
            vy: -30,
            life: 0.6,
            r: 0,
            text: "CRIT!",
            textColor: "#ffeb3b",
            textSize: 14,
          });
        }

        // Particles for hit
        for (let i = 0; i < (isCrit ? 10 : 5); i++) {
          particles.push({
            x: this.x,
            y: this.y,
            vx: (Math.random() - 0.5) * (isCrit ? 50 : 30),
            vy: (Math.random() - 0.5) * (isCrit ? 50 : 30),
            life: 0.3 + Math.random() * 0.2,
            r: isCrit ? 3 : 2,
            c: isCrit ? "#ffeb3b" : this.spec.color, // yellow for crits
          });
        }
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

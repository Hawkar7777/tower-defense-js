// ===== FILE: src/artilleryShell.js =====

import { ctx } from "./core.js";
import { enemies, particles } from "./state.js";
import { dist } from "./utils.js";
import { spawnExplosion } from "./effects.js";

export class ArtilleryShell {
  constructor(startX, startY, targetX, targetY, spec) {
    this.x = startX;
    this.y = startY;
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.spec = spec;

    // Calculate trajectory
    this.totalDistance = dist(
      { x: startX, y: startY },
      { x: targetX, y: targetY }
    );
    this.traveled = 0;
    this.progress = 0;

    // Calculate angle to target
    this.angle = Math.atan2(targetY - startY, targetX - startX);

    this.active = true;
    this.exploded = false;

    // Add smoke trail
    this.lastSmokeTime = 0;
  }

  update(dt) {
    if (!this.active || this.exploded) return;

    // Move shell along trajectory
    const speed = this.spec.bulletSpeed * dt;
    this.traveled += speed;
    this.progress = this.traveled / this.totalDistance;

    if (this.progress >= 1) {
      // Reached target - explode
      this.explode();
      return;
    }

    // Calculate position with arc
    this.x = this.startX + Math.cos(this.angle) * this.traveled;
    this.y = this.startY + Math.sin(this.angle) * this.traveled;

    // Add arc height (parabolic trajectory)
    const arcProgress = this.progress * 2 - 1; // Convert to -1 to 1 range
    const height = this.spec.arcHeight * (1 - arcProgress * arcProgress);
    this.y -= height;

    // Create smoke trail
    this.lastSmokeTime += dt;
    if (this.lastSmokeTime > 0.05) {
      this.lastSmokeTime = 0;
      this.createSmokeTrail();
    }
  }

  createSmokeTrail() {
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: this.x + (Math.random() - 0.5) * 3,
        y: this.y + (Math.random() - 0.5) * 3,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20 - 10, // Rise slightly
        life: 0.8 + Math.random() * 0.4,
        r: 2 + Math.random() * 2,
        c: "#888",
        gravity: -0.1,
        fade: 0.95,
      });
    }
  }

  explode() {
    this.exploded = true;
    this.active = false;

    // Create explosion effect
    spawnExplosion(
      this.targetX,
      this.targetY,
      this.spec.splash * 0.8,
      "#ff8c00"
    );

    // Additional explosion particles
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      const size = 3 + Math.random() * 3;
      const life = 0.6 + Math.random() * 0.4;

      particles.push({
        x: this.targetX,
        y: this.targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        r: size,
        c: "#ff8c00",
        gravity: 0.3,
        fade: 0.9,
      });
    }

    // Damage enemies in splash radius
    for (const enemy of enemies) {
      if (enemy.dead) continue;

      const d = dist({ x: this.targetX, y: this.targetY }, enemy.pos);
      if (d <= this.spec.splash) {
        // Calculate damage falloff from center
        const damageMultiplier = 1 - (d / this.spec.splash) * 0.5; // 50% damage at edge
        enemy.damage(this.spec.dmg * damageMultiplier);
      }
    }
  }

  draw() {
    if (!this.active || this.exploded) return;

    // Draw shell
    ctx.fillStyle = this.spec.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw shell details
    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.stroke();

    // Draw fins
    const finAngle = this.angle + Math.PI / 2;
    for (let i = 0; i < 4; i++) {
      const angle = finAngle + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(this.x + Math.cos(angle) * 3, this.y + Math.sin(angle) * 3);
      ctx.lineTo(this.x + Math.cos(angle) * 6, this.y + Math.sin(angle) * 6);
      ctx.stroke();
    }
  }
}

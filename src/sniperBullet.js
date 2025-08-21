// ===== FILE: src/sniperBullet.js =====

import { ctx } from "./core.js";
import { enemies, particles } from "./state.js";
import { dist } from "./utils.js";
import { spawnHit, spawnBeam } from "./effects.js";

export class SniperBullet {
  constructor(x, y, angle, spec) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.spec = spec;
    this.speed = spec.bulletSpeed;
    this.penetration = spec.penetration;
    this.hitEnemies = new Set(); // Track enemies already hit
    this.traveled = 0;
    this.maxTravel = spec.range * 1.2; // Can travel slightly beyond range
    this.active = true;

    // Determine if this is a critical hit
    this.isCritical = Math.random() < spec.critChance;
    this.damage = this.isCritical ? spec.dmg * spec.critMultiplier : spec.dmg;
  }

  update(dt) {
    if (!this.active) return;

    // Move bullet
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;
    this.traveled += this.speed * dt;

    // Check if bullet has traveled too far
    if (this.traveled >= this.maxTravel) {
      this.active = false;
      return;
    }

    // Check for collisions with enemies
    for (const enemy of enemies) {
      if (enemy.dead || this.hitEnemies.has(enemy)) continue;

      const d = dist({ x: this.x, y: this.y }, enemy.pos);
      if (d <= enemy.r) {
        // Hit enemy
        this.hitEnemies.add(enemy);

        // Draw hit effect
        spawnHit(this.x, this.y, this.isCritical ? "#ff0000" : this.spec.color);

        // Draw bullet trail
        spawnBeam(
          {
            x: this.x - Math.cos(this.angle) * 20,
            y: this.y - Math.sin(this.angle) * 20,
          },
          { x: this.x, y: this.y },
          this.isCritical ? "#ff0000" : this.spec.color
        );

        // Apply damage
        enemy.damage(this.damage);

        // Critical hit effect
        if (this.isCritical) {
          this.spawnCriticalEffect(enemy.pos.x, enemy.pos.y);
        }

        // Reduce penetration
        this.penetration--;

        // If no penetration left, deactivate bullet
        if (this.penetration <= 0) {
          this.active = false;
          return;
        }
      }
    }
  }

  spawnCriticalEffect(x, y) {
    // Critical hit visual effect
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * 100,
        vy: Math.sin(angle) * 100,
        life: 0.5 + Math.random() * 0.3,
        r: 2 + Math.random() * 2,
        c: "#ff0000",
        gravity: 0.1,
        fade: 0.9,
      });
    }

    // Critical hit text effect
    particles.push({
      x,
      y: y - 20,
      vx: 0,
      vy: -30,
      life: 1,
      r: 10,
      c: "#ff0000",
      text: "CRIT!",
      fade: 0.9,
    });
  }

  draw() {
    if (!this.active) return;

    // Draw bullet
    ctx.fillStyle = this.isCritical ? "#ff0000" : this.spec.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw bullet trail
    const trailLength = 15;
    const gradient = ctx.createLinearGradient(
      this.x - Math.cos(this.angle) * trailLength,
      this.y - Math.sin(this.angle) * trailLength,
      this.x,
      this.y
    );
    gradient.addColorStop(
      0,
      this.isCritical ? "rgba(255, 0, 0, 0)" : `${this.spec.color}00`
    );
    gradient.addColorStop(
      1,
      this.isCritical ? "rgba(255, 0, 0, 0.8)" : `${this.spec.color}cc`
    );

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(
      this.x - Math.cos(this.angle) * trailLength,
      this.y - Math.sin(this.angle) * trailLength
    );
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
  }
}

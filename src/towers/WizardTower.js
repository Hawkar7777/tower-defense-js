// ===== FILE: src/towers/WizardTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, particles, projectiles } from "../state.js";
import { dist } from "../utils.js";

// Fireball projectile
// ===== FILE: src/towers/WizardTower.js =====

// Fireball projectile - change 'done' to 'dead'
class Fireball {
  constructor(start, target, dmg, color) {
    this.pos = { ...start };
    this.target = target;
    this.speed = 120; // slow fireball
    this.dmg = dmg;
    this.color = color;
    this.dead = false; // Changed from 'done' to 'dead'
  }

  update(dt) {
    if (!this.target || this.target.dead) {
      this.dead = true; // Changed from 'done' to 'dead'
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);

    if (distToTarget < 6) {
      if (typeof this.target.damage === "function")
        this.target.damage(this.dmg);

      // Explosion effect
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 50 + 20;
        particles.push({
          x: this.pos.x,
          y: this.pos.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.5,
          r: 2 + Math.random() * 2,
          c: "#ff5500",
          fade: 0.9,
        });
      }

      this.dead = true; // Changed from 'done' to 'dead'
      return;
    }

    const vx = (dx / distToTarget) * this.speed;
    const vy = (dy / distToTarget) * this.speed;
    this.pos.x += vx * dt;
    this.pos.y += vy * dt;

    // Trail particles
    particles.push({
      x: this.pos.x + (Math.random() - 0.5) * 4,
      y: this.pos.y + (Math.random() - 0.5) * 4,
      vx: 0,
      vy: 0,
      life: 0.3,
      r: 1.5,
      c: "#ff3300",
      fade: 0.85,
    });
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class WizardTower extends BaseTower {
  static SPEC = {
    name: "Wizard Tower",
    cost: 400,
    range: 160,
    fireRate: 0.5, // slower fire like CoC
    dmg: 50,
    color: "#ff3300",
  };

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.3;
    return {
      ...base,
      dmg: base.dmg * mult,
      range: base.range * (1 + (this.level - 1) * 0.1),
    };
  }

  getAttackOrigin() {
    return { x: this.center.x, y: this.center.y - 20 };
  }

  update(dt, enemiesList) {
    const s = this.spec();
    this.cool -= dt;

    if (this.cool <= 0) {
      let target = null;
      let minDist = Infinity;
      for (const e of enemiesList) {
        if (e.dead) continue;
        const d = dist(this.center, e.pos);
        if (d <= s.range && d < minDist) {
          target = e;
          minDist = d;
        }
      }

      if (target) {
        this.cool = 1 / s.fireRate;
        projectiles.push(
          new Fireball(this.getAttackOrigin(), target, s.dmg, s.color)
        );
      }
    }
  }

  draw() {
    const { x, y } = this.center;
    const time = performance.now() / 600;

    // Tower base
    ctx.fillStyle = "#4b2a6c";
    ctx.beginPath();
    ctx.arc(x, y + 8, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff3300";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Tower body - stone tower
    ctx.fillStyle = "#6a3b8f";
    ctx.beginPath();
    ctx.rect(x - 8, y - 16, 16, 24);
    ctx.fill();
    ctx.strokeStyle = "#ff6600";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Crystal on top
    const crystalY = y - 18 + Math.sin(time) * 3;
    ctx.fillStyle = "#ff5500";
    ctx.beginPath();
    ctx.moveTo(x, crystalY - 6);
    ctx.lineTo(x - 5, crystalY + 3);
    ctx.lineTo(x + 5, crystalY + 3);
    ctx.closePath();
    ctx.fill();

    // Magic particles orbiting
    for (let i = 0; i < 4; i++) {
      const angle = time + i * (Math.PI / 2);
      const px = x + Math.cos(angle) * 8;
      const py = crystalY + Math.sin(angle) * 3;
      particles.push({
        x: px,
        y: py,
        vx: 0,
        vy: 0,
        life: 0.3,
        r: 1.5,
        c: "#ff8800",
        fade: 0.9,
      });
    }

    // Level indicators
    for (let i = 0; i < this.level; i++) {
      const ix = x - 10 + i * 5;
      const iy = y + 25;
      ctx.strokeStyle = "#ff8800";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(ix, iy + 4);
      ctx.stroke();
    }
  }
}

// ===== In your main game loop (where projectiles are updated) =====
// Add this function to update and clean up projectiles:

export function updateProjectiles(dt) {
  // Update all projectiles
  projectiles.forEach((p) => p.update(dt));

  // Remove completed projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (projectiles[i].done) {
      projectiles.splice(i, 1);
    }
  }
}

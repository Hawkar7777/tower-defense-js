// ===== FILE: src/towers/VolcanoTower.js =====
import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";

// LavaRock projectile
class LavaRock {
  constructor(start, targetPos, dmg, radius, color) {
    this.pos = { ...start };
    this.start = { ...start };
    this.targetPos = { ...targetPos };
    this.dmg = dmg;
    this.radius = radius;
    this.color = color;
    this.dead = false;

    this.progress = 0;
    this.speed = 1.5;
  }

  update(dt) {
    if (this.dead) return;

    this.progress += dt / this.speed;
    if (this.progress >= 1) {
      this.explode();
      this.dead = true;
      return;
    }

    // Arc flight
    this.pos.x =
      this.start.x + (this.targetPos.x - this.start.x) * this.progress;
    this.pos.y =
      this.start.y +
      (this.targetPos.y - this.start.y) * this.progress -
      Math.sin(Math.PI * this.progress) * 40;

    // Smoke + ember trail
    particles.push({
      x: this.pos.x + (Math.random() - 0.5) * 6,
      y: this.pos.y + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 20,
      vy: -20,
      life: 0.5,
      r: 2,
      c: Math.random() < 0.3 ? "#ff6600" : "#552200", // sparks + smoke
      fade: 0.8,
    });
  }

  explode() {
    // Shockwave ring
    particles.push({
      x: this.pos.x,
      y: this.pos.y,
      life: 0.3,
      r: this.radius,
      ring: true,
      c: "rgba(255,120,0,0.4)",
      fade: 1,
    });

    // Explosion debris
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 100;
      particles.push({
        x: this.pos.x,
        y: this.pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8,
        r: 2 + Math.random() * 3,
        c: Math.random() < 0.5 ? "#ff4400" : "#ffaa00",
        fade: 0.9,
      });
    }

    // Damage enemies
    for (const e of enemies) {
      if (e.dead) continue;
      const d = dist(this.pos, e.pos);
      if (d <= this.radius) {
        if (typeof e.damage === "function") e.damage(this.dmg);
      }
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff6600";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export class VolcanoTower extends BaseTower {
  static SPEC = {
    name: "Volcano Tower",
    cost: 600,
    range: 200,
    fireRate: 0.3,
    dmg: 80,
    splash: 60,
    color: "#ff3300",
  };

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.25;
    return {
      ...base,
      dmg: base.dmg * mult,
      splash: base.splash * (1 + (this.level - 1) * 0.1),
      range: base.range * (1 + (this.level - 1) * 0.1),
    };
  }

  getAttackOrigin() {
    return { x: this.center.x, y: this.center.y - 25 };
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
          new LavaRock(
            this.getAttackOrigin(),
            target.pos,
            s.dmg,
            s.splash,
            s.color
          )
        );
      }
    }
  }

  draw() {
    const { x, y } = this.center;
    const time = performance.now() / 500;

    // Base crater shadow
    const grd = ctx.createRadialGradient(x, y, 5, x, y, 25);
    grd.addColorStop(0, "#4a1c10");
    grd.addColorStop(1, "#1a0a05");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y + 8, 22, 0, Math.PI * 2);
    ctx.fill();

    // Volcano cone with cracks
    ctx.fillStyle = "#6b2f1c";
    ctx.beginPath();
    ctx.moveTo(x - 20, y + 8);
    ctx.lineTo(x, y - 32);
    ctx.lineTo(x + 20, y + 8);
    ctx.closePath();
    ctx.fill();

    // Cracks glow
    ctx.strokeStyle = Math.random() < 0.5 ? "#ff5500" : "#ffaa00";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x - 2, y - 16);
    ctx.lineTo(x + 4, y - 6);
    ctx.stroke();

    // Lava glow pulse
    ctx.fillStyle = `rgba(255,80,0,${0.5 + Math.sin(time) * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y - 20, 10 + Math.sin(time) * 2, 0, Math.PI * 2);
    ctx.fill();

    // Smoke & embers
    for (let i = 0; i < 4; i++) {
      const puffX = x + Math.sin(time + i) * 6;
      const puffY = y - 38 - i * 10 - (time % 1) * 12;
      ctx.fillStyle = "rgba(80,80,80,0.5)";
      ctx.beginPath();
      ctx.arc(puffX, puffY, 7 - i, 0, Math.PI * 2);
      ctx.fill();

      if (Math.random() < 0.05) {
        particles.push({
          x: puffX,
          y: puffY,
          vx: (Math.random() - 0.5) * 40,
          vy: -50,
          life: 0.4,
          r: 2,
          c: "#ffaa33",
          fade: 0.9,
        });
      }
    }

    // Level ticks
    for (let i = 0; i < this.level; i++) {
      ctx.strokeStyle = "#ffaa00";
      ctx.beginPath();
      ctx.moveTo(x - 12 + i * 6, y + 28);
      ctx.lineTo(x - 12 + i * 6, y + 32);
      ctx.stroke();
    }
  }
}

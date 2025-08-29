// ===== FILE: src/towers/VolcanoTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";
import { soundManager } from "../assets/sounds/SoundManager.js";
import { TOWER_TYPES } from "../config.js"; // <-- dynamic config

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

    this.pos.x =
      this.start.x + (this.targetPos.x - this.start.x) * this.progress;
    this.pos.y =
      this.start.y +
      (this.targetPos.y - this.start.y) * this.progress -
      Math.sin(Math.PI * this.progress) * 60;

    particles.push({
      x: this.pos.x + (Math.random() - 0.5) * 6,
      y: this.pos.y + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 20,
      vy: -20,
      life: 0.5,
      r: 1 + Math.random(),
      c: Math.random() < 0.3 ? "#ff8800" : "#4d2b1b",
      fade: 0.8,
    });
    soundManager.playSound("volcanoShoot1", 0.3);
  }

  explode() {
    particles.push({
      x: this.pos.x,
      y: this.pos.y,
      life: 0.3,
      r: this.radius,
      ring: true,
      c: "rgba(255,120,0,0.5)",
      fade: 1,
    });
    particles.push({
      x: this.pos.x,
      y: this.pos.y,
      life: 0.2,
      r: this.radius * 0.5,
      ring: true,
      c: "rgba(255,255,150,0.5)",
      fade: 1,
    });

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 80;
      particles.push({
        x: this.pos.x,
        y: this.pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8,
        r: 1 + Math.random() * 2.5,
        c: Math.random() < 0.5 ? "#ff4400" : "#ffaa00",
        fade: 0.9,
      });
      soundManager.playSound("volcanoShoot", 0.3);
    }

    for (const e of enemies) {
      if (e.dead) continue;
      if (dist(this.pos, e.pos) <= this.radius) {
        if (typeof e.damage === "function") e.damage(this.dmg);
      }
    }
  }

  draw() {
    ctx.fillStyle = "#3b1e10";
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff6600";
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffdd00";
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class VolcanoTower extends BaseTower {
  spec() {
    const base = TOWER_TYPES.volcano; // Use dynamic config
    const mult = 1 + (this.level - 1) * 0.25;
    return {
      ...base,
      dmg: base.dmg * mult,
      splash: base.splash * (1 + (this.level - 1) * 0.1),
      range: base.range * (1 + (this.level - 1) * 0.1),
    };
  }

  getAttackOrigin() {
    const { x, y } = this.center;
    const craterCenterY = y - 35;
    return { x, y: craterCenterY };
  }

  update(dt, enemiesList) {
    if (this.isHexed) return;
    const s = this.spec();
    this.cool -= dt;

    if (this.cool <= 0) {
      let target = null;
      let closestDist = s.range;
      for (const e of enemiesList) {
        if (e.dead) continue;
        const d = dist(this.center, e.pos);
        if (d <= closestDist) {
          target = e;
          closestDist = d;
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

    const particleOriginY = this.getAttackOrigin().y - 5;
    if (Math.random() < 0.2) {
      particles.push({
        x: this.center.x + (Math.random() - 0.5) * 15,
        y: particleOriginY + Math.random() * 5,
        vx: (Math.random() - 0.5) * 15,
        vy: -30 - Math.random() * 20,
        life: 1.8,
        r: 5 + Math.random() * 4,
        c: `rgba(50, 40, 30, 0.6)`,
        fade: 0.97,
      });
    }
    if (Math.random() < 0.1) {
      particles.push({
        x: this.center.x + (Math.random() - 0.5) * 10,
        y: particleOriginY,
        vx: (Math.random() - 0.5) * 50,
        vy: -70 - Math.random() * 50,
        life: 0.6,
        r: 2 + Math.random() * 3,
        c: "#ffaa00",
        fade: 0.9,
      });
    }
  }

  draw() {
    const { x, y } = this.center;
    const time = performance.now();
    const s = this.spec();

    ctx.save();

    // Base Plateau
    ctx.fillStyle = "#333333";
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + 18, 35, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Volcanic Mountain
    ctx.fillStyle = "#412b23";
    ctx.strokeStyle = "#241813";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 30, y + 18);
    ctx.lineTo(x - 20, y - 5);
    ctx.lineTo(x - 10, y - 20);
    ctx.lineTo(x - 3, y - 30);
    ctx.lineTo(x + 3, y - 30);
    ctx.lineTo(x + 10, y - 20);
    ctx.lineTo(x + 20, y - 5);
    ctx.lineTo(x + 30, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Secondary rock layers
    ctx.fillStyle = "#3b251d";
    ctx.beginPath();
    ctx.moveTo(x - 25, y + 10);
    ctx.lineTo(x - 15, y - 10);
    ctx.lineTo(x + 15, y - 10);
    ctx.lineTo(x + 25, y + 10);
    ctx.closePath();
    ctx.fill();

    // Active Crater
    const craterY = y - 35;
    ctx.fillStyle = "#2c1c16";
    ctx.beginPath();
    ctx.ellipse(x, craterY, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff4400";
    ctx.beginPath();
    ctx.ellipse(x, craterY + 2, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    const bubble1X = x + Math.sin(time / 200) * 2;
    const bubble1Y = craterY + 2 + Math.cos(time / 200) * 1;
    ctx.fillStyle = `rgba(255, 220, 0, ${0.7 + Math.sin(time / 100) * 0.3})`;
    ctx.beginPath();
    ctx.arc(
      bubble1X,
      bubble1Y,
      1.5 + Math.sin(time / 150) * 0.8,
      0,
      Math.PI * 2
    );
    ctx.fill();

    const bubble2X = x - Math.sin(time / 180) * 3;
    const bubble2Y = craterY + 2 - Math.cos(time / 180) * 1.5;
    ctx.fillStyle = `rgba(255, 255, 100, ${0.6 + Math.sin(time / 90) * 0.2})`;
    ctx.beginPath();
    ctx.arc(
      bubble2X,
      bubble2Y,
      1.0 + Math.sin(time / 120) * 0.6,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Lava cracks
    ctx.strokeStyle = `rgba(255, 120, 0, ${0.5 + Math.sin(time / 150) * 0.2})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 25);
    ctx.lineTo(x - 15, y + 5);
    ctx.moveTo(x + 5, y - 25);
    ctx.lineTo(x + 18, y + 10);
    ctx.stroke();

    // Level Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Lv. ${this.level}`, x, y + 35);

    ctx.restore();
  }
}

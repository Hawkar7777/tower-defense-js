// ===== FILE: src/towers/VolcanoTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";

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

  // --- MODIFIED --- Moved up to match new taller design
  getAttackOrigin() {
    return { x: this.center.x, y: this.center.y - 35 };
  }

  update(dt, enemiesList) {
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

    // --- MODIFIED --- Particles now erupt from the taller peak
    const particleOriginY = this.center.y - 38;
    if (Math.random() < 0.2) {
      particles.push({
        x: this.center.x + (Math.random() - 0.5) * 15,
        y: particleOriginY,
        vx: (Math.random() - 0.5) * 10,
        vy: -40 - Math.random() * 20,
        life: 1.5,
        r: 4 + Math.random() * 4,
        c: `rgba(50, 40, 30, 0.6)`,
        fade: 0.97,
      });
    }
    if (Math.random() < 0.1) {
      particles.push({
        x: this.center.x,
        y: particleOriginY,
        vx: (Math.random() - 0.5) * 40,
        vy: -80 - Math.random() * 40,
        life: 0.8,
        r: 1 + Math.random() * 2,
        c: "#ffaa00",
        fade: 0.9,
      });
    }
  }

  // --- TALLER DESIGN DRAW METHOD ---
  draw() {
    const { x, y } = this.center;
    const time = performance.now();

    // 1. Ambient heat glow (Unchanged)
    const heatRadius = 25 + Math.sin(time / 400) * 3;
    const heatGlow = ctx.createRadialGradient(
      x,
      y + 10,
      5,
      x,
      y + 10,
      heatRadius
    );
    heatGlow.addColorStop(0, `rgba(255, 100, 0, 0.4)`);
    heatGlow.addColorStop(1, `rgba(255, 100, 0, 0)`);
    ctx.fillStyle = heatGlow;
    ctx.fillRect(
      x - heatRadius,
      y + 10 - heatRadius,
      heatRadius * 2,
      heatRadius * 2
    );

    // 2. Taller, steeper rocky cone
    ctx.fillStyle = "#412b23";
    ctx.strokeStyle = "#241813";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 20, y + 18); // Base starts a little lower and narrower
    ctx.lineTo(x - 12, y - 15);
    ctx.lineTo(x - 5, y - 25);
    ctx.lineTo(x, y - 38); // New, higher peak
    ctx.lineTo(x + 8, y - 22);
    ctx.lineTo(x + 15, y - 10);
    ctx.lineTo(x + 22, y + 18); // Base starts a little lower and narrower
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Glowing lava cracks, adjusted for the taller cone
    ctx.strokeStyle = `rgba(255, 180, 0, ${0.6 + Math.sin(time / 200) * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 10); // Start lower
    ctx.lineTo(x - 4, y - 18); // End higher
    ctx.moveTo(x + 12, y + 5); // Start lower
    ctx.lineTo(x + 3, y - 24); // End higher
    ctx.stroke();

    // 4. Bubbling lava in the taller caldera
    const calderaY = y - 35; // New, higher position
    ctx.fillStyle = "#ff4400";
    ctx.beginPath();
    ctx.ellipse(x, calderaY, 8, 4, 0, 0, Math.PI * 2); // Slightly smaller caldera
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    const bubble1X = x + Math.sin(time / 300) * 3;
    const bubble1R = 1.5 + Math.sin(time / 250) * 1;
    ctx.fillStyle = `rgba(255, 220, 0, 0.8)`;
    ctx.beginPath();
    ctx.arc(bubble1X, calderaY, bubble1R, 0, Math.PI * 2);
    ctx.fill();
    const bubble2X = x - Math.sin(time / 220) * 2.5;
    const bubble2R = 1.5 + Math.sin(time / 350) * 1;
    ctx.fillStyle = `rgba(255, 255, 100, 0.7)`;
    ctx.beginPath();
    ctx.arc(bubble2X, calderaY, bubble2R, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // 5. Level indicators (Unchanged, still on the base)
    for (let i = 0; i < this.level; i++) {
      const angle = -1.8 - i * 0.5;
      const runeX = x + Math.cos(angle) * 18;
      const runeY = y + 12 + Math.sin(angle) * 4;
      ctx.fillStyle = "#ffdd00";
      ctx.shadowColor = "#ffaa00";
      ctx.shadowBlur = 4;
      ctx.fillRect(runeX, runeY, 3, 3);
    }
    ctx.shadowBlur = 0;
  }
}

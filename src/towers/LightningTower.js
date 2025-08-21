// ===== FILE: src/towers/LightningTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, particles } from "../state.js";
import { dist } from "../utils.js";
import { spawnBeam } from "../effects.js";

export class LightningTower extends BaseTower {
  static SPEC = {
    name: "Lightning Tower",
    cost: 300,
    range: 150,
    fireRate: 1.5,
    dmg: 30,
    chainCount: 4,
    chainRange: 100,
    stunChance: 0.2,
    stunDuration: 1.2,
    color: "#00ffff",
  };

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.3;
    return {
      name: base.name,
      range: base.range * (1 + (this.level - 1) * 0.1),
      fireRate: base.fireRate,
      dmg: base.dmg * mult,
      chainCount: base.chainCount,
      chainRange: base.chainRange,
      stunChance: base.stunChance,
      stunDuration: base.stunDuration,
      color: base.color,
      cost: base.cost,
    };
  }

  // New method to get the top of the tower as lightning origin
  getLightningOrigin() {
    return {
      x: this.center.x,
      y: this.center.y - 40, // just above the coil/antenna
    };
  }

  update(dt, enemiesList) {
    const s = this.spec();
    this.cool -= dt;

    // Find closest enemy in range
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

    // Fire lightning if cooldown ready
    if (this.cool <= 0 && target) {
      this.cool = 1 / s.fireRate;
      this.fireLightning(target, s);
    }
  }

  fireLightning(startEnemy, spec) {
    const hitEnemies = new Set();
    let current = startEnemy;
    let prevPos = this.getLightningOrigin(); // <-- use top of tower

    for (let i = 0; i <= spec.chainCount; i++) {
      if (!current || current.dead || hitEnemies.has(current)) break;

      if (typeof current.damage === "function") current.damage(spec.dmg);
      if (
        Math.random() < spec.stunChance &&
        typeof current.stun === "function"
      ) {
        current.stun(spec.stunDuration);
      }

      // Draw beam
      spawnBeam(prevPos, current.pos, spec.color, 2 + Math.random() * 1.5);

      // Add sparks along the beam
      for (let s = 0; s < 5; s++) {
        particles.push({
          x: prevPos.x + (current.pos.x - prevPos.x) * Math.random(),
          y: prevPos.y + (current.pos.y - prevPos.y) * Math.random(),
          vx: (Math.random() - 0.5) * 60,
          vy: (Math.random() - 0.5) * 60,
          life: 0.3 + Math.random() * 0.3,
          r: 1 + Math.random() * 2,
          c: spec.color,
          fade: 0.85,
        });
      }

      hitEnemies.add(current);
      prevPos = current.pos;

      // Find next target
      let nextEnemy = null;
      let minDist = Infinity;
      for (const e of enemies) {
        if (e.dead || hitEnemies.has(e)) continue;
        const d = dist(current.pos, e.pos);
        if (d <= spec.chainRange && d < minDist) {
          nextEnemy = e;
          minDist = d;
        }
      }

      current = nextEnemy;
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;
    const time = performance.now() / 500;

    // Tower body - futuristic segmented hex design
    ctx.fillStyle = "#0a3f3b"; // darker teal base
    ctx.strokeStyle = "#00ffff"; // cyan outline
    ctx.lineWidth = 2;

    // Draw three stacked hex segments
    const segmentHeight = 15;
    for (let i = 0; i < 3; i++) {
      const cy = y + 20 - i * segmentHeight;
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (Math.PI / 3) * j;
        const rx = 12 * Math.cos(angle);
        const ry = (segmentHeight / 2) * Math.sin(angle);
        if (j === 0) ctx.moveTo(x + rx, cy + ry);
        else ctx.lineTo(x + rx, cy + ry);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glowing top coil
    const coilRadius = 8 + Math.sin(time) * 2;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y - 25, coilRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Antenna on top
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 33);
    ctx.lineTo(x, y - 45);
    ctx.stroke();

    // Sparks at top
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y - 45 + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 50,
        vy: (Math.random() - 0.5) * 50,
        life: 0.2 + Math.random() * 0.2,
        r: 1 + Math.random() * 1.5,
        c: s.color,
        fade: 0.9,
      });
    }

    // Level indicators - small glowing bars at base
    for (let i = 0; i < this.level; i++) {
      const ix = x - 12 + i * 6;
      const iy = y + 25;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(ix, iy + 4);
      ctx.stroke();
    }
  }
}

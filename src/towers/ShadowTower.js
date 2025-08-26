// ===== FILE: src/towers/ShadowTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, particles, projectiles } from "../state.js";
import { dist } from "../utils.js";

class ShadowOrb {
  constructor(start, target, dmg, curseDmg, curseDuration, color) {
    this.pos = { ...start };
    this.target = target;
    this.speed = 180;
    this.dmg = dmg;
    this.curseDmg = curseDmg;
    this.curseDuration = curseDuration;
    this.color = color;
    this.done = false;
  }

  update(dt) {
    if (!this.target || this.target.dead) {
      this.done = true;
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);
    if (distToTarget < 4) {
      if (typeof this.target.damage === "function")
        this.target.damage(this.dmg);

      if (!this.target.curse)
        this.target.curse = {
          dmg: this.curseDmg,
          duration: this.curseDuration,
          timer: 0,
        };

      // Shadow explosion particles on hit
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: this.target.pos.x + (Math.random() - 0.5) * 12,
          y: this.target.pos.y + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 50,
          vy: (Math.random() - 0.5) * 50,
          life: 0.4 + Math.random() * 0.3,
          r: 2 + Math.random() * 2,
          c: this.color,
          fade: 0.9,
        });
      }

      this.done = true;
      return;
    }

    const vx = (dx / distToTarget) * this.speed;
    const vy = (dy / distToTarget) * this.speed;
    this.pos.x += vx * dt;
    this.pos.y += vy * dt;

    // Shadow trail particles
    particles.push({
      x: this.pos.x + (Math.random() - 0.5) * 8,
      y: this.pos.y + (Math.random() - 0.5) * 8,
      vx: 0,
      vy: 0,
      life: 0.3 + Math.random() * 0.3,
      r: 2 + Math.random(),
      c: this.color,
      fade: 0.9,
    });
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class ShadowTower extends BaseTower {
  static SPEC = {
    name: "Shadow Tower",
    cost: 320,
    range: 140,
    fireRate: 1.2,
    dmg: 15,
    curseDmg: 5,
    curseDuration: 4,
    chainCount: 3,
    chainRange: 90,
    color: "#800080",
  };

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.25;
    return {
      ...base,
      dmg: base.dmg * mult,
      curseDmg: base.curseDmg * mult,
      range: base.range * (1 + (this.level - 1) * 0.1),
    };
  }

  getAttackOrigin() {
    return { x: this.center.x, y: this.center.y - 40 };
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
        this.castShadow(target, s);
      }
    }

    // Remove finished ShadowOrbs from projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      if (p instanceof ShadowOrb && p.done) projectiles.splice(i, 1);
    }
  }

  castShadow(startEnemy, spec) {
    const hitEnemies = new Set();
    let current = startEnemy;

    for (let i = 0; i <= spec.chainCount; i++) {
      if (!current || current.dead || hitEnemies.has(current)) break;

      projectiles.push(
        new ShadowOrb(
          this.getAttackOrigin(),
          current,
          spec.dmg,
          spec.curseDmg,
          spec.curseDuration,
          spec.color
        )
      );

      hitEnemies.add(current);

      // Chain to next
      let nextEnemy = null;
      let minD = Infinity;
      for (const e of enemies) {
        if (e.dead || hitEnemies.has(e)) continue;
        const d = dist(current.pos, e.pos);
        if (d <= spec.chainRange && d < minD) {
          nextEnemy = e;
          minD = d;
        }
      }
      current = nextEnemy;
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;
    const time = performance.now() / 500;

    // Twisted spire body
    ctx.fillStyle = "#1a0a2aff";
    ctx.strokeStyle = "#800080";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x - 14, y + 20);
    ctx.lineTo(x + 14, y + 20);
    ctx.lineTo(x + 6, y - 22);
    ctx.lineTo(x - 6, y - 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Floating shard at top
    const shardY = y - 30 + Math.sin(time) * 4;
    ctx.strokeStyle = "#d100ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, shardY);
    ctx.lineTo(x, shardY - 12);
    ctx.stroke();

    // Shadow particles around top
    for (let i = 0; i < 4; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: shardY - 12 + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 0.3 + Math.random() * 0.3,
        r: 2,
        c: "#d100ff",
        fade: 0.9,
      });
    }

    // --- OLD CODE (REMOVE OR COMMENT OUT) ---
    // // Level indicators
    // for (let i = 0; i < this.level; i++) {
    //   const ix = x - 10 + i * 5;
    //   const iy = y + 25;
    //   ctx.strokeStyle = "#d100ff";
    //   ctx.lineWidth = 1.5;
    //   ctx.beginPath();
    //   ctx.moveTo(ix, iy);
    //   ctx.lineTo(ix, iy + 4);
    //   ctx.stroke();
    // }
    // --- END OLD CODE ---

    // --- NEW CODE: Display Level as Text for ShadowTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
    // --- END NEW CODE ---
  }
}

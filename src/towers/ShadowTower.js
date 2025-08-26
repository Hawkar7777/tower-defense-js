// ===== FILE: src/towers/ShadowTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, particles, projectiles } from "../state.js";
import { dist } from "../utils.js";

// Enhanced ShadowOrb projectile
class ShadowOrb {
  constructor(start, target, dmg, curseDmg, curseDuration, color) {
    this.pos = { ...start };
    this.target = target;
    this.speed = 180;
    this.dmg = dmg;
    this.curseDmg = curseDmg;
    this.curseDuration = curseDuration;
    this.color = color; // Base color of the orb
    this.dead = false;
    this.age = 0;
  }

  update(dt) {
    this.age += dt;
    if (!this.target || this.target.dead) {
      this.dead = true;
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);

    if (distToTarget < 6) {
      // Slightly increased hit radius for visual impact
      if (typeof this.target.damage === "function")
        this.target.damage(this.dmg);

      if (!this.target.curse) {
        this.target.curse = {
          dmg: this.curseDmg,
          duration: this.curseDuration,
          timer: 0,
        };
      } else {
        // Refresh curse duration if already cursed
        this.target.curse.duration = this.curseDuration;
        this.target.curse.timer = 0;
      }

      // Shadow explosion particles on hit
      for (let i = 0; i < 10; i++) {
        // More particles
        particles.push({
          x: this.target.pos.x + (Math.random() - 0.5) * 15,
          y: this.target.pos.y + (Math.random() - 0.5) * 15,
          vx: (Math.random() - 0.5) * 60,
          vy: (Math.random() - 0.5) * 60,
          life: 0.5 + Math.random() * 0.4,
          r: 3 + Math.random() * 3,
          c: this.color, // Use orb's color for explosion
          fade: 0.9,
        });
      }

      this.dead = true;
      return;
    }

    const vx = (dx / distToTarget) * this.speed;
    const vy = (dy / distToTarget) * this.speed;
    this.pos.x += vx * dt;
    this.pos.y += vy * dt;

    // Shadow trail particles (more prominent)
    particles.push({
      x: this.pos.x + (Math.random() - 0.5) * 10, // Wider trail
      y: this.pos.y + (Math.random() - 0.5) * 10,
      vx: 0,
      vy: 0,
      life: 0.4 + Math.random() * 0.3, // Longer life
      r: 3 + Math.random() * 2, // Larger particles
      c: `rgba(128, 0, 128, ${0.4 + Math.random() * 0.3})`, // Faint purple glow
      fade: 0.88,
    });
  }

  draw() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter"; // For glowing effect

    // Main orb body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 6, 0, Math.PI * 2); // Larger orb
    ctx.fill();

    // Inner glow
    ctx.fillStyle = `rgba(255, 255, 255, ${
      0.6 + Math.sin(this.age * 8) * 0.2
    })`;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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
    color: "#800080", // Main color (deep purple)
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

  // Projectiles should originate from the top of the floating crystal
  getAttackOrigin() {
    const { x, y } = this.center;
    const time = performance.now() / 500;
    // Base position for the floating crystal's top
    const crystalTipY = y - 35 + Math.sin(time * 0.8) * 4; // Animated hover
    return { x: x, y: crystalTipY };
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
      if (p instanceof ShadowOrb && p.dead) projectiles.splice(i, 1); // Changed to .dead
    }
  }

  castShadow(startEnemy, spec) {
    const hitEnemies = new Set();
    let current = startEnemy;

    for (let i = 0; i <= spec.chainCount; i++) {
      if (!current || current.dead || hitEnemies.has(current)) break;

      projectiles.push(
        new ShadowOrb(
          this.getAttackOrigin(), // Projectile starts from the crystal tip
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
    const time = performance.now() / 500; // For animations

    // Calculate hover effect for the entire structure
    const hoverOffset = Math.sin(time * 0.5) * 2;
    ctx.save();
    ctx.translate(0, hoverOffset);

    // 1. Dark, floating base platform
    ctx.fillStyle = "#1a0a2aff"; // Very dark purple
    ctx.strokeStyle = "#3a1a5aff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + 15, 25, 12, 0, 0, Math.PI * 2); // Wider oval base
    ctx.fill();
    ctx.stroke();

    // Base glowing energy lines
    ctx.shadowColor = s.color; // Deep purple glow
    ctx.shadowBlur = 6;
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i + time * 0.1;
      const lineX1 = x + Math.cos(angle) * 15;
      const lineY1 = y + 15 + Math.sin(angle) * 8;
      const lineX2 = x + Math.cos(angle + 0.5) * 22;
      const lineY2 = y + 15 + Math.sin(angle + 0.5) * 10;
      ctx.strokeStyle = `rgba(128, 0, 128, ${
        0.5 + Math.sin(time * 0.7 + i) * 0.3
      })`;
      ctx.beginPath();
      ctx.moveTo(lineX1, lineY1);
      ctx.lineTo(lineX2, lineY2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0; // Reset shadow

    // 2. Central Obsidian/Crystal Structure (Jagged)
    const crystalBaseY = y + 10;
    const crystalTipY = y - 35; // This matches getAttackOrigin's Y
    ctx.fillStyle = "#2a0a3a"; // Dark obsidian purple
    ctx.strokeStyle = "#4a1a6aff"; // Brighter purple veins
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Complex jagged shape
    ctx.moveTo(x, crystalTipY); // Peak
    ctx.lineTo(x + 10, crystalTipY + 15);
    ctx.lineTo(x + 8, crystalBaseY - 5);
    ctx.lineTo(x + 18, crystalBaseY + 5);
    ctx.lineTo(x, crystalBaseY + 10);
    ctx.lineTo(x - 18, crystalBaseY + 5);
    ctx.lineTo(x - 8, crystalBaseY - 5);
    ctx.lineTo(x - 10, crystalTipY + 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Swirling Shadow Energy around the crystal
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "#e0b0ff"; // Light purple glow
    ctx.shadowBlur = 10;
    for (let i = 0; i < 5; i++) {
      const swirlFactor = Math.sin(time * 0.9 + i) * 10;
      const swirlSize = 8 + Math.sin(time * 0.7 + i) * 4;
      const swirlX = x + Math.cos(time * 1.5 + i) * (15 + swirlFactor);
      const swirlY =
        (crystalTipY + crystalBaseY) / 2 +
        Math.sin(time * 1.5 + i) * (10 + swirlFactor * 0.5);

      ctx.fillStyle = `rgba(224, 176, 255, ${
        0.4 + Math.sin(time * 2 + i) * 0.3
      })`; // Pulsating transparency
      ctx.beginPath();
      ctx.arc(swirlX, swirlY, swirlSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";

    // --- Display Level as Text for ShadowTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the base platform
    ctx.fillText(`Lv. ${this.level}`, x, y + 35 - hoverOffset);
    // --- END NEW CODE ---

    ctx.restore(); // End hover translation
  }
}

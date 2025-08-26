// ===== FILE: src/towers/WizardTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, particles, projectiles } from "../state.js";
import { dist } from "../utils.js";

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
    color: "#ff3300", // Base color, but visuals will use more blues/purples
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

  // Attack origin should be where the orb is, for visual consistency
  getAttackOrigin() {
    const { x, y } = this.center;
    const time = performance.now() / 600;
    // Position of the floating orb, accounting for bobbing animation
    const orbY = y - 30 + Math.sin(time) * 3;
    return { x: x, y: orbY };
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
    const time = performance.now() / 600; // For animations
    const s = this.spec(); // Get current spec for level, etc.

    // Calculate hover effect for the entire structure
    const hoverOffset = Math.sin(time * 0.5) * 2;
    ctx.save();
    ctx.translate(0, hoverOffset);

    // 1. Arcane Base Platform
    ctx.fillStyle = "#34495e"; // Dark blue-gray
    ctx.strokeStyle = "#5d6d7e"; // Lighter blue-gray border
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + 15, 25, 12, 0, 0, Math.PI * 2); // Wider, oval base
    ctx.fill();
    ctx.stroke();

    // Base glowing runes
    ctx.shadowColor = "#8e44ad"; // Purple glow
    ctx.shadowBlur = 8;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + time * 0.1;
      const runeX = x + Math.cos(angle) * 20;
      const runeY = y + 15 + Math.sin(angle) * 8;
      ctx.fillStyle = "rgba(142, 68, 173, 0.7)"; // Purple
      ctx.beginPath();
      ctx.arc(runeX, runeY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0; // Reset shadow

    // 2. Central Energy Conduit/Pylon
    const pylonHeight = 40;
    ctx.fillStyle = "#2c3e50"; // Darker blue-gray
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 10);
    ctx.lineTo(x - 5, y + 10 - pylonHeight);
    ctx.lineTo(x + 5, y + 10 - pylonHeight);
    ctx.lineTo(x + 8, y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#4b6c8f"; // Blue-steel border
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Main Pulsating Arcane Orb
    const orbY = y + 10 - pylonHeight; // Orb is at the top of the pylon
    const orbPulseSize = 10 + Math.sin(time * 1.5) * 2; // Pulsating effect
    const orbInnerGlowSize = orbPulseSize * 0.5;

    // Outer glow for the orb
    ctx.globalCompositeOperation = "lighter"; // Blending mode for glow
    const outerOrbGrad = ctx.createRadialGradient(
      x,
      orbY,
      0,
      x,
      orbY,
      orbPulseSize * 2
    );
    outerOrbGrad.addColorStop(
      0,
      `rgba(155, 89, 182, ${0.7 + Math.sin(time * 2) * 0.3})`
    ); // Strong purple
    outerOrbGrad.addColorStop(1, "rgba(155, 89, 182, 0)");
    ctx.fillStyle = outerOrbGrad;
    ctx.beginPath();
    ctx.arc(x, orbY, orbPulseSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Main orb body
    const orbGrad = ctx.createRadialGradient(x, orbY, 0, x, orbY, orbPulseSize);
    orbGrad.addColorStop(0, "#E0BBE4"); // Light lavender
    orbGrad.addColorStop(0.5, "#957DAD"); // Medium purple
    orbGrad.addColorStop(1, "#60477E"); // Darker purple
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(x, orbY, orbPulseSize, 0, Math.PI * 2);
    ctx.fill();

    // Inner core glow
    const innerOrbGrad = ctx.createRadialGradient(
      x,
      orbY,
      0,
      x,
      orbY,
      orbInnerGlowSize
    );
    innerOrbGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
    innerOrbGrad.addColorStop(1, "rgba(200, 160, 240, 0.7)");
    ctx.fillStyle = innerOrbGrad;
    ctx.beginPath();
    ctx.arc(x, orbY, orbInnerGlowSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over"; // Reset blending mode

    // 4. Arcane energy flowing around the orb
    for (let i = 0; i < 3; i++) {
      const swirlAngle = time * 0.7 + i * ((Math.PI * 2) / 3);
      const swirlRadius = orbPulseSize + 5 + Math.sin(time * 1.8 + i) * 3;
      const pX = x + Math.cos(swirlAngle) * swirlRadius;
      const pY = orbY + Math.sin(swirlAngle) * swirlRadius * 0.5; // Elliptical orbit
      particles.push({
        x: pX,
        y: pY,
        vx: 0,
        vy: 0,
        life: 0.3,
        r: 1.5,
        c: `rgba(190, 150, 220, ${0.8 + Math.sin(time * 3 + i) * 0.2})`, // Pulsating particle alpha
        fade: 0.9,
      });
    }

    // --- Display Level as Text for WizardTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower base, accounting for hover
    ctx.fillText(`Lv. ${this.level}`, x, y + 35 - hoverOffset);
    // --- END NEW CODE ---

    ctx.restore(); // End hover translation
  }
}

// ===== In your main game loop (where projectiles are updated) =====
// Add this function to update and clean up projectiles:

export function updateProjectiles(dt) {
  // Update all projectiles
  projectiles.forEach((p) => p.update(dt));

  // Remove completed projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (projectiles[i].dead) {
      // Changed to 'dead' from 'done' to match Fireball class
      projectiles.splice(i, 1);
    }
  }
}

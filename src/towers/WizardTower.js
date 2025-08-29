// ===== FILE: src/towers/WizardTower.js =====
// (keep your existing imports)
import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, particles, projectiles } from "../state.js";
import { dist } from "../utils.js";
import { soundManager } from "../assets/sounds/SoundManager.js";
import { TOWER_TYPES } from "../config.js";

// helper: convert hex like "#7f00ff" to "rgba(r,g,b,a)"
function hexToRgba(hex, a = 1) {
  if (!hex) return `rgba(255,255,255,${a})`;
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

class Fireball {
  constructor(start, target, dmg, color, chainRemaining = 0, chainRange = 0) {
    this.pos = { ...start };
    this.target = target;
    this.speed = 120;
    this.dmg = dmg;
    this.color = color;
    this.dead = false;
    this.chainRemaining = chainRemaining;
    this.chainRange = chainRange;
    this.ownerId = null; // optional: set if you want to avoid friendly-fire or track source
  }

  update(dt) {
    if (!this.target || this.target.dead) {
      this.dead = true;
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);

    if (distToTarget < 6) {
      if (typeof this.target.damage === "function") {
        this.target.damage(this.dmg);
      }

      // Explosion effect (same as before)
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

      // CHAIN LOGIC: spawn chained fireballs if chains remain
      if (this.chainRemaining > 0) {
        // find nearest valid enemy within chainRange (exclude the one just hit)
        let nearest = null;
        let nearestD = Infinity;
        for (const e of enemies) {
          if (!e || e.dead) continue;
          if (e === this.target) continue;
          const d = dist(this.pos, e.pos);
          if (d <= this.chainRange && d < nearestD) {
            nearest = e;
            nearestD = d;
          }
        }

        if (nearest) {
          // spawn a new chained fireball from current position to 'nearest'
          // apply damage falloff (example: 70% of previous)
          const childDmg = Math.max(1, Math.round(this.dmg * 0.7));
          projectiles.push(
            new Fireball(
              { x: this.pos.x, y: this.pos.y },
              nearest,
              childDmg,
              this.color,
              this.chainRemaining - 1,
              this.chainRange
            )
          );
          // optional: play a chain sound
          soundManager.playSound("wizardChain", 0.2);
        }
      }

      this.dead = true;
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
  spec() {
    const base = TOWER_TYPES.wizard; // use dynamic config
    const mult = 1 + (this.level - 1) * 0.3;
    return {
      ...base,
      dmg: base.dmg * mult,
      range: base.range * (1 + (this.level - 1) * 0.1),
      // Keep chain props from base (they can also be scaled with level if desired)
      chainCount: base.chainCount ?? 0,
      chainRange: base.chainRange ?? 0,
    };
  }

  getAttackOrigin() {
    const { x, y } = this.center;
    const time = performance.now() / 600;
    const orbY = y - 30 + Math.sin(time) * 3;
    return { x, y: orbY };
  }

  update(dt, enemiesList) {
    if (this.isHexed) return;
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
        // Pass chainRemaining = s.chainCount - 1 so chainCount represents total hits
        const chainRemaining = Math.max(0, (s.chainCount || 0) - 1);
        projectiles.push(
          new Fireball(
            this.getAttackOrigin(),
            target,
            s.dmg,
            s.color,
            chainRemaining,
            s.chainRange
          )
        );
        soundManager.playSound("wizardShoot", 0.3);
      }
    }
  }

  draw() {
    const { x, y } = this.center;
    const time = performance.now() / 600;
    const s = this.spec();

    const hoverOffset = Math.sin(time * 0.5) * 2;
    ctx.save();
    ctx.translate(0, hoverOffset);

    // Arcane Base Platform
    ctx.fillStyle = "#34495e";
    ctx.strokeStyle = "#5d6d7e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + 15, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Base glowing runes (we keep purple-ish but fade uses s.color)
    ctx.shadowColor = s.color || "#8e44ad";
    ctx.shadowBlur = 8;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + time * 0.1;
      const runeX = x + Math.cos(angle) * 20;
      const runeY = y + 15 + Math.sin(angle) * 8;
      ctx.fillStyle = hexToRgba(s.color, 0.75);
      ctx.beginPath();
      ctx.arc(runeX, runeY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Central Pylon
    const pylonHeight = 40;
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 10);
    ctx.lineTo(x - 5, y + 10 - pylonHeight);
    ctx.lineTo(x + 5, y + 10 - pylonHeight);
    ctx.lineTo(x + 8, y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#4b6c8f";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pulsating Arcane Orb - now uses s.color
    const orbY = y + 10 - pylonHeight;
    const orbPulseSize = 10 + Math.sin(time * 1.5) * 2;
    const orbInnerGlowSize = orbPulseSize * 0.5;

    ctx.globalCompositeOperation = "lighter";
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
      hexToRgba(s.color, 0.7 + Math.sin(time * 2) * 0.3)
    );
    outerOrbGrad.addColorStop(1, hexToRgba(s.color, 0));
    ctx.fillStyle = outerOrbGrad;
    ctx.beginPath();
    ctx.arc(x, orbY, orbPulseSize * 2, 0, Math.PI * 2);
    ctx.fill();

    const orbGrad = ctx.createRadialGradient(x, orbY, 0, x, orbY, orbPulseSize);
    orbGrad.addColorStop(0, hexToRgba("#ffffff", 1));
    orbGrad.addColorStop(0.5, hexToRgba(s.color, 0.9));
    orbGrad.addColorStop(1, hexToRgba(s.color, 0.7));
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(x, orbY, orbPulseSize, 0, Math.PI * 2);
    ctx.fill();

    const innerOrbGrad = ctx.createRadialGradient(
      x,
      orbY,
      0,
      x,
      orbY,
      orbInnerGlowSize
    );
    innerOrbGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
    innerOrbGrad.addColorStop(1, hexToRgba(s.color, 0.85));
    ctx.fillStyle = innerOrbGrad;
    ctx.beginPath();
    ctx.arc(x, orbY, orbInnerGlowSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Arcane energy swirling particles
    for (let i = 0; i < 3; i++) {
      const swirlAngle = time * 0.7 + i * ((Math.PI * 2) / 3);
      const swirlRadius = orbPulseSize + 5 + Math.sin(time * 1.8 + i) * 3;
      const pX = x + Math.cos(swirlAngle) * swirlRadius;
      const pY = orbY + Math.sin(swirlAngle) * swirlRadius * 0.5;
      particles.push({
        x: pX,
        y: pY,
        vx: 0,
        vy: 0,
        life: 0.3,
        r: 1.5,
        c: `rgba(190,150,220,${0.8 + Math.sin(time * 3 + i) * 0.2})`,
        fade: 0.9,
      });
    }

    // Level Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Lv. ${this.level}`, x, y + 35 - hoverOffset);

    ctx.restore();
  }
}

// Call this in your game loop to update projectiles (unchanged)
export function updateProjectiles(dt) {
  projectiles.forEach((p) => p.update(dt));
  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (projectiles[i].dead) projectiles.splice(i, 1);
  }
}

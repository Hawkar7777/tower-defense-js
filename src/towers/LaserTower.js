// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\LaserTower.js =====

import { BaseTower } from "./BaseTower.js";
import { spawnBeam } from "../effects.js";
import { ctx } from "../core.js";
import { soundManager } from "../assets/sounds/SoundManager.js"; // Import the sound manager
import { dist } from "../utils.js"; // Import dist for update method
import { TOWER_TYPES } from "../config.js";

export class LaserTower extends BaseTower {
  fireBeam(start, end, color) {
    spawnBeam(start, end, color);
    soundManager.playSound("laserShoot", 0.4); // Play sound via manager with specific volume
  }

  spec() {
    const base = TOWER_TYPES.laser; // Get laser tower config
    const mult = 1 + (this.level - 1) * 0.2; // Optional scaling
    return {
      ...base,
      dmg: base.dmg * mult,
      range: base.range * (1 + (this.level - 1) * 0.05),
    };
  }

  update(dt, enemiesList) {
    if (this.isHexed) return;
    const s = this.spec();
    this.cool -= dt;

    let best = null;
    let bestScore = -1;

    for (const e of enemiesList) {
      if (e.dead) continue;
      const d = dist(this.center, e.pos);
      if (d <= s.range && e.t > bestScore) {
        best = e;
        bestScore = e.t;
      }
    }

    if (!best) return;

    const c = this.center;
    const bp = best.pos;
    this.rot = Math.atan2(bp.y - c.y, bp.x - c.x);

    if (this.cool <= 0) {
      this.cool = 1 / (s.fireRate * this.slowMultiplier);
      this.fireBeam(c, bp, s.color);
      best.hp -= s.dmg;
      if (best.hp <= 0) best.dead = true;
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;
    const time = performance.now() / 1000;

    // Draw high-tech base platform with glow
    ctx.fillStyle = "#0e1626";
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();

    // Platform glow effect
    const gradient = ctx.createRadialGradient(x, y, 12, x, y, 22);
    gradient.addColorStop(0, "rgba(255, 105, 224, 0.3)");
    gradient.addColorStop(1, "rgba(255, 105, 224, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Platform border with energy effect
    ctx.strokeStyle = "#223c62";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    // Main housing - futuristic design
    ctx.fillStyle = "#2a2a3a";
    ctx.beginPath();
    ctx.roundRect(-10, -12, 20, 24, 8);
    ctx.fill();

    // Energy core housing
    ctx.fillStyle = "#1a1a2a";
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing energy core
    const pulseSize = 6 + Math.sin(time * 5) * 1.5;
    const coreAlpha = 0.7 + Math.sin(time * 3) * 0.3;

    ctx.fillStyle = `rgba(255, 220, 255, ${coreAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 105, 224, 0.6)";
    ctx.beginPath();
    ctx.arc(0, 0, pulseSize * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Laser emitter array
    ctx.fillStyle = "#4a4a6a";
    ctx.beginPath();
    ctx.roundRect(8, -8, 16, 16, 4);
    ctx.fill();

    // Laser lenses
    ctx.fillStyle = "#a0a0ff";
    ctx.beginPath();
    ctx.arc(16, -4, 3, 0, Math.PI * 2);
    ctx.arc(16, 0, 3, 0, Math.PI * 2);
    ctx.arc(16, 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Main laser lens (center)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(16, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Energy conduits
    ctx.strokeStyle = "#ff69e0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(6, -6);
    ctx.lineTo(10, -2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-6, 6);
    ctx.lineTo(6, 6);
    ctx.lineTo(10, 2);
    ctx.stroke();

    // Cooling fins/heat sinks
    ctx.fillStyle = "#3a3a5a";
    for (let i = -10; i <= 10; i += 5) {
      ctx.fillRect(-12, i, 4, 2);
    }

    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);

    // Add some particle effects around the tower
    if (Math.random() < 0.1) {
      this.drawEnergyParticle(x, y, time);
    }
  }

  drawEnergyParticle(x, y, time) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 10;
    const size = 1 + Math.random() * 2;

    const particleX = x + Math.cos(angle) * distance;
    const particleY = y + Math.sin(angle) * distance;

    ctx.fillStyle = `rgba(180, 100, 255, ${0.3 + Math.sin(time * 10) * 0.2})`;
    ctx.beginPath();
    ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Add roundRect method to CanvasRenderingContext2D if it doesn't exist
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x,
    y,
    width,
    height,
    radius
  ) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;

    this.beginPath();
    this.moveTo(x + radius, y);
    this.arcTo(x + width, y, x + width, y + height, radius);
    this.arcTo(x + width, y + height, x, y + height, radius);
    this.arcTo(x, y + height, x, y, radius);
    this.arcTo(x, y, x + width, y, radius);
    this.closePath();
    return this;
  };
}

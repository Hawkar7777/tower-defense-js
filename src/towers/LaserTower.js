// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\LaserTower.js =====

import { BaseTower } from "./BaseTower.js";
import { spawnBeam } from "../effects.js";
import { ctx } from "../core.js";

export class LaserTower extends BaseTower {
  static SPEC = {
    name: "Laser",
    cost: 250,
    range: 150,
    fireRate: 12,
    dmg: 5,
    beam: true,
    color: "#ff69e0",
  };

  fireBeam(start, end, color) {
    spawnBeam(start, end, color);
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

    // Draw tower body
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

    // Draw level indicators with glow effect
    for (let i = 0; i < this.level; i++) {
      const indicatorX = x - 10 + i * 6;
      const indicatorY = y + 22;

      // Glow effect
      ctx.fillStyle = "rgba(255, 105, 224, 0.3)";
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Main indicator
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing effect for higher levels
      if (this.level > 3 && i >= this.level - 3) {
        const pulse = Math.sin(time * 4) * 2;
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, 3 + pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }

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

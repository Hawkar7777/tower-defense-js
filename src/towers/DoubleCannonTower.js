// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\DoubleCannonTower.js =====

import { BaseTower } from "./BaseTower.js";
import { projectiles } from "../state.js";
import { spawnMuzzle } from "../effects.js";
import { Bullet } from "../bullet.js";
import { ctx } from "../core.js";

export class DoubleCannonTower extends BaseTower {
  static SPEC = {
    name: "Double Canon",
    cost: 160,
    range: 120,
    fireRate: 0.9,
    dmg: 75,
    splash: 55,
    bulletSpeed: 240,
    color: "#f00",
  };

  fireProjectile(center, target, spec) {
    const offset = 8; // Increased offset for wider barrels
    const sin = Math.sin(this.rot);
    const cos = Math.cos(this.rot);

    // left barrel
    projectiles.push(
      new Bullet(center.x - sin * offset, center.y + cos * offset, target, spec)
    );

    // right barrel
    projectiles.push(
      new Bullet(center.x + sin * offset, center.y - cos * offset, target, spec)
    );

    spawnMuzzle(
      center.x - sin * offset,
      center.y + cos * offset,
      this.rot,
      spec.color
    );
    spawnMuzzle(
      center.x + sin * offset,
      center.y - cos * offset,
      this.rot,
      spec.color
    );
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;

    // Draw base platform
    ctx.fillStyle = "#0e1626";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Draw platform border
    ctx.strokeStyle = "#223c62";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();

    // Draw cannon mounting platform
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    // Mounting base
    ctx.fillStyle = "#4a4a5a";
    ctx.beginPath();
    ctx.roundRect(-14, -10, 28, 20, 6);
    ctx.fill();

    // Draw two cannon barrels
    const barrelOffset = 8;

    // Left cannon
    this.drawCannonBarrel(-barrelOffset, 0, s.color);

    // Right cannon
    this.drawCannonBarrel(barrelOffset, 0, s.color);

    // Central mounting hardware
    ctx.fillStyle = "#5a5a6a";
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Bolts on mounting platform
    ctx.fillStyle = "#7a7a8a";
    ctx.beginPath();
    ctx.arc(-10, -6, 2, 0, Math.PI * 2);
    ctx.arc(10, -6, 2, 0, Math.PI * 2);
    ctx.arc(-10, 6, 2, 0, Math.PI * 2);
    ctx.arc(10, 6, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Draw level indicators
    for (let i = 0; i < this.level; i++) {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(x - 12 + i * 6, y + 22, 3, 0, Math.PI * 2);
      ctx.fill();

      // Add glow effect for higher levels
      if (this.level > 2 && i >= this.level - 2) {
        ctx.fillStyle = "rgba(255, 100, 100, 0.4)";
        ctx.beginPath();
        ctx.arc(x - 12 + i * 6, y + 22, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawCannonBarrel(xOffset, yOffset, color) {
    // Cannon barrel - main body
    const gradient = ctx.createLinearGradient(xOffset - 5, -8, xOffset - 5, 8);
    gradient.addColorStop(0, "#9a8a7a");
    gradient.addColorStop(0.5, "#c5b8a2");
    gradient.addColorStop(1, "#9a8a7a");
    ctx.fillStyle = gradient;

    // Draw barrel with rounded front
    ctx.beginPath();
    ctx.roundRect(xOffset - 8, -5, 26, 10, 5);
    ctx.fill();

    // Barrel rings/bands
    ctx.fillStyle = "#6a6a7a";
    ctx.fillRect(xOffset - 5, -6, 3, 12);
    ctx.fillRect(xOffset + 5, -6, 3, 12);
    ctx.fillRect(xOffset + 15, -6, 3, 12);

    // Cannon muzzle
    ctx.fillStyle = "#5a5a6a";
    ctx.beginPath();
    ctx.arc(xOffset + 18, 0, 5, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Cannon interior (dark hole)
    ctx.fillStyle = "#1a1a2a";
    ctx.beginPath();
    ctx.arc(xOffset + 20, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Red accent on barrel (matching tower color)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(xOffset - 2, 0, 2, 0, Math.PI * 2);
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

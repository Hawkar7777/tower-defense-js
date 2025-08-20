// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\CannonTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";

export class CannonTower extends BaseTower {
  static SPEC = {
    name: "Cannon",
    cost: 120,
    range: 140,
    fireRate: 1.2,
    dmg: 55,
    splash: 60,
    bulletSpeed: 260,
    color: "#f6c66a",
  };

  draw() {
    const s = this.spec();
    const { x, y } = this.center;

    // Draw base platform
    ctx.fillStyle = "#0e1626";
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();

    // Draw platform border
    ctx.strokeStyle = "#223c62";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Draw cannon body
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    // Cannon base
    ctx.fillStyle = "#3a3a4a";
    ctx.fillRect(-12, -8, 24, 16);

    // Cannon barrel - main body
    const gradient = ctx.createLinearGradient(0, -10, 0, 10);
    gradient.addColorStop(0, "#8a7a6a");
    gradient.addColorStop(0.5, "#b5a892");
    gradient.addColorStop(1, "#8a7a6a");
    ctx.fillStyle = gradient;

    // Draw barrel with rounded front
    ctx.beginPath();
    ctx.roundRect(-8, -6, 30, 12, 6);
    ctx.fill();

    // Barrel rings/bands
    ctx.fillStyle = "#5a5a6a";
    ctx.fillRect(-5, -7, 3, 14);
    ctx.fillRect(5, -7, 3, 14);
    ctx.fillRect(15, -7, 3, 14);

    // Cannon muzzle
    ctx.fillStyle = "#4a4a5a";
    ctx.beginPath();
    ctx.arc(22, 0, 6, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Cannon interior (dark hole)
    ctx.fillStyle = "#1a1a2a";
    ctx.beginPath();
    ctx.arc(24, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Draw level indicators
    for (let i = 0; i < this.level; i++) {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(x - 10 + i * 6, y + 18, 3, 0, Math.PI * 2);
      ctx.fill();
    }
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

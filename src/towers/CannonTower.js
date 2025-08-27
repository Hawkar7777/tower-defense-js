import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

export class CannonTower extends BaseTower {
  constructor(gx, gy, key) {
    super(gx, gy, key);
    // Removed: this.shootSound = new Audio(...) and related properties
  }

  // Removed: playShootSound method

  fireProjectile(center, target, spec) {
    // Call the original BaseTower's fireProjectile.
    const projectileFired = super.fireProjectile(center, target, spec);

    if (projectileFired) {
      // Use the sound manager to play the sound
      soundManager.playSound("cannonShoot", 0.6); // Play sound via manager with specific volume
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;

    ctx.fillStyle = "#4a4a5a";
    ctx.strokeStyle = "#8a8a9a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const hx = x + 20 * Math.cos(angle);
      const hy = y + 20 * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    const turretGradient = ctx.createLinearGradient(0, -12, 0, 12);
    turretGradient.addColorStop(0, "#95a5a6");
    turretGradient.addColorStop(1, "#7f8c8d");
    ctx.fillStyle = turretGradient;
    ctx.strokeStyle = "#546363";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-15, -12, 20, 24, 6);
    ctx.fill();
    ctx.stroke();

    const recoilRatio = this.cool / (1 / s.fireRate);
    const recoilDistance = Math.sin(recoilRatio * Math.PI) * 6;

    ctx.save();
    ctx.translate(-recoilDistance, 0);

    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(-5, -8, 15, 16);

    const barrelGradient = ctx.createLinearGradient(0, -6, 0, 6);
    barrelGradient.addColorStop(0, "#c5c5c5");
    barrelGradient.addColorStop(0.5, "#ffffff");
    barrelGradient.addColorStop(1, "#c5c5c5");
    ctx.fillStyle = barrelGradient;
    ctx.fillRect(10, -6, 25, 12);

    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(35, -7, 5, 14);
    ctx.fillRect(32, -8, 3, 2);
    ctx.fillRect(32, 6, 3, 2);

    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.arc(40, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = s.color;
    ctx.fillRect(8, -7, 4, 14);

    ctx.restore();

    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
  }
}

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

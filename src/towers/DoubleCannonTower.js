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
    color: "#ff3333",
  };

  // --- THIS IS THE CORRECTED FUNCTION ---
  fireProjectile(center, target, spec) {
    const offset = 8; // Distance of each barrel from the center line
    const barrelLength = 22; // The visual length of the barrel from the turret pivot
    const sin = Math.sin(this.rot);
    const cos = Math.cos(this.rot);

    // Calculate the exact tip position of each barrel
    const muzzle1X = center.x + cos * barrelLength - sin * offset;
    const muzzle1Y = center.y + sin * barrelLength + cos * offset;
    const muzzle2X = center.x + cos * barrelLength + sin * offset;
    const muzzle2Y = center.y + sin * barrelLength - cos * offset;

    // --- THE FIX ---
    // Fire one projectile from the tip of each barrel
    projectiles.push(new Bullet(muzzle1X, muzzle1Y, target, spec));
    projectiles.push(new Bullet(muzzle2X, muzzle2Y, target, spec));
    // --- END OF FIX ---

    // Spawn muzzle flash at the same barrel tip positions
    spawnMuzzle(muzzle1X, muzzle1Y, this.rot, spec.color);
    spawnMuzzle(muzzle2X, muzzle2Y, this.rot, spec.color);
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;

    // 1. Heavy Hexagonal Base
    ctx.fillStyle = "#2c3e50";
    ctx.strokeStyle = "#567a9e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = x + 20 * Math.cos(angle);
      const hy = y + 20 * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Rotating Turret
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    // Armored Turret Body
    const turretGradient = ctx.createLinearGradient(0, -12, 0, 12);
    turretGradient.addColorStop(0, "#95a5a6");
    turretGradient.addColorStop(1, "#7f8c8d");
    ctx.fillStyle = turretGradient;
    ctx.strokeStyle = "#546363";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.lineTo(10, -12);
    ctx.lineTo(10, 12);
    ctx.lineTo(-8, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Recoil Animation Logic
    const recoilRatio = this.cool / (1 / s.fireRate);
    const recoilDistance = Math.sin(recoilRatio * Math.PI) * 5;

    // 4. Draw Cannons with Recoil
    this.drawCannonBarrel(-8, recoilDistance, s.color); // Left Barrel
    this.drawCannonBarrel(8, recoilDistance, s.color); // Right Barrel

    // Central turret pivot
    ctx.fillStyle = "#546363";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 5. Level Indicators on the Base
    for (let i = 0; i < this.level; i++) {
      const angle = 2.5 + i * 0.4;
      const lx = x + Math.cos(angle) * 16;
      const ly = y + Math.sin(angle) * 16;
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  drawCannonBarrel(yOffset, recoil, color) {
    ctx.save();
    ctx.translate(-10 - recoil, yOffset);

    // Barrel Base
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(0, -6, 8, 12);

    // Main Barrel
    const barrelGradient = ctx.createLinearGradient(0, -5, 0, 5);
    barrelGradient.addColorStop(0, "#bababa");
    barrelGradient.addColorStop(0.5, "#fdfdfd");
    barrelGradient.addColorStop(1, "#bababa");
    ctx.fillStyle = barrelGradient;
    ctx.fillRect(8, -5, 24, 10);

    // Muzzle Brake
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(32, -6, 4, 12);
    ctx.fillRect(28, -7, 4, 2);
    ctx.fillRect(28, 5, 4, 2);

    // Barrel opening
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.arc(36, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Red accent rings
    ctx.fillStyle = color;
    ctx.fillRect(10, -6, 3, 12);
    ctx.fillRect(20, -6, 3, 12);

    ctx.restore();
  }
}

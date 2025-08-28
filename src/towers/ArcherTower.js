// ===== FILE: src/towers/ArcherTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";
import { ArrowProjectile } from "../arrowProjectile.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

export class ArcherTower extends BaseTower {
  static SPEC = {
    name: "Archer Tower",
    cost: 90,
    range: 140,
    fireRate: 5,
    dmg: 12,
    bulletSpeed: 400,
    critChance: 0.15,
    critMultiplier: 1.7,
    color: "#4fc3f7",
    accentColor: "#ffeb3b",
  };

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.25;
    return {
      name: base.name,
      range: base.range * (1 + (this.level - 1) * 0.05),
      fireRate: base.fireRate * (1 + (this.level - 1) * 0.05),
      dmg: base.dmg * mult,
      bulletSpeed: base.bulletSpeed,
      critChance: base.critChance,
      critMultiplier: base.critMultiplier,
      color: base.color,
      accentColor: base.accentColor,
      cost: base.cost,
    };
  }

  update(dt, enemiesList) {
    super.update(dt, enemiesList);

    // If hexed, don't do any GunTower-specific logic
    if (this.isHexed) return;
    const s = this.spec();
    this.cool -= dt;

    let target = null;
    let nearestDist = Infinity;
    for (const e of enemiesList) {
      if (e.dead) continue;
      const d = dist(this.center, e.pos);
      if (d <= s.range && d < nearestDist) {
        target = e;
        nearestDist = d;
      }
    }

    if (target) {
      const dx = target.pos.x - this.center.x;
      const dy = target.pos.y - this.center.y;
      this.rot = Math.atan2(dy, dx) + Math.PI / 2;
    }

    if (target && this.cool <= 0) {
      this.cool = 1 / s.fireRate;
      this.fireArrow(target, s);
    }
  }

  fireArrow(target, spec) {
    const c = this.center;
    const startX = c.x + Math.cos(this.rot - Math.PI / 2) * 15;
    const startY = c.y + Math.sin(this.rot - Math.PI / 2) * 15;

    // Use ArrowProjectile class for precise hit detection
    const arrow = new ArrowProjectile(startX, startY, target, spec);
    projectiles.push(arrow);

    // Optional muzzle particles
    for (let i = 0; i < 4; i++) {
      particles.push({
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 25,
        vy: (Math.random() - 0.5) * 25,
        life: 0.3 + Math.random() * 0.2,
        r: 2,
        c: spec.color,
      });
    }

    this.recoilEffect = 2.5;
    soundManager.playSound("archerShoot", 0.3);
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;

    ctx.save();
    ctx.translate(x, y);

    if (this.recoilEffect > 0) {
      ctx.translate(0, -this.recoilEffect);
      this.recoilEffect -= 0.15;
    }

    ctx.rotate(this.rot);

    // Shadow / depth
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.arc(2, 2, 16, 0, Math.PI * 2);
    ctx.fill();

    // Tower base - layered planks
    ctx.fillStyle = "#6d4c41";
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-10, -24);
    ctx.lineTo(10, -24);
    ctx.lineTo(14, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Metallic accents
    ctx.fillStyle = "#b0bec5";
    ctx.beginPath();
    ctx.arc(0, -12, 4, 0, Math.PI * 2);
    ctx.fill();

    // Bow - curved
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(6, -24, 0, -32);
    ctx.quadraticCurveTo(-6, -24, 0, -16);
    ctx.stroke();

    // Arrow string
    ctx.strokeStyle = "#37474f";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(0, -32);
    ctx.stroke();

    // Quiver with glowing arrows
    ctx.fillStyle = s.accentColor;
    ctx.beginPath();
    ctx.rect(-6, -20, 12, 24);
    ctx.fill();

    // Subtle glowing arrows
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = `rgba(255,235,59,${0.5 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(-3 + i * 2, -20 + i * 2);
      ctx.lineTo(-1 + i * 2, -2 + i * 2);
      ctx.lineTo(1 + i * 2, -2 + i * 2);
      ctx.lineTo(3 + i * 2, -20 + i * 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // --- OLD CODE (REMOVE OR COMMENT OUT) ---
    // // Draw level indicators as crosshair icons
    // for (let i = 0; i < this.level; i++) {
    //   const indicatorX = x - 12 + i * 6;
    //   const indicatorY = y + 25;

    //   // Crosshair icon
    //   ctx.strokeStyle = s.color;
    //   ctx.lineWidth = 1.5;
    //   ctx.beginPath();
    //   ctx.arc(indicatorX, indicatorY, 2, 0, Math.PI * 2);
    //   ctx.stroke();

    //   ctx.beginPath();
    //   ctx.moveTo(indicatorX - 3, indicatorY);
    //   ctx.lineTo(indicatorX + 3, indicatorY);
    //   ctx.moveTo(indicatorX, indicatorY - 3);
    //   ctx.lineTo(indicatorX, indicatorY + 3);
    //   ctx.stroke();
    // }
    // --- END OLD CODE ---

    // --- NEW CODE: Display Level as Text for ArcherTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
    // --- END NEW CODE ---
  }
}

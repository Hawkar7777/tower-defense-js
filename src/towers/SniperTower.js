// ===== FILE: src/towers/SniperTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";
import { spawnMuzzle, spawnHit } from "../effects.js";
import { SniperBullet } from "../sniperBullet.js"; // We'll create this special projectile

export class SniperTower extends BaseTower {
  static SPEC = {
    name: "Sniper Tower",
    cost: 350,
    range: 400, // Very long range
    fireRate: 0.3, // Slow fire rate
    dmg: 200, // High damage
    bulletSpeed: 1200, // Very fast bullet
    penetration: 2, // Can penetrate through multiple enemies
    critChance: 0.25, // Chance for critical hit
    critMultiplier: 2.5, // Damage multiplier for critical hits
    color: "#2b4162",
  };

  // Override spec to include sniper properties
  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.5; // Higher multiplier for damage
    return {
      name: base.name,
      range: base.range * (1 + (this.level - 1) * 0.15), // Better range scaling
      fireRate: base.fireRate * (1 + (this.level - 1) * 0.1),
      dmg: base.dmg * mult,
      bulletSpeed: base.bulletSpeed,
      penetration: base.penetration + Math.floor((this.level - 1) / 2), // Increase penetration every 2 levels
      critChance: base.critChance + (this.level - 1) * 0.05,
      critMultiplier: base.critMultiplier + (this.level - 1) * 0.1,
      color: base.color,
      cost: base.cost,
    };
  }

  update(dt, enemiesList) {
    const s = this.spec();
    this.cool -= dt;

    // Sniper tower prioritizes high-value targets (farthest along the path)
    let best = null;
    let bestScore = -1;
    for (const e of enemiesList) {
      if (e.dead) continue;
      const p = e.pos;
      const d = dist(this.center, p);
      if (d <= s.range && e.t > bestScore) {
        best = e;
        bestScore = e.t;
      }
    }

    // If we found a target, aim at it
    if (best) {
      const dx = best.pos.x - this.center.x;
      const dy = best.pos.y - this.center.y;
      this.rot = Math.atan2(dy, dx) + Math.PI / 2;
    }

    // Fire if cooldown is ready and there's a target
    if (this.cool <= 0 && best) {
      this.cool = 1 / s.fireRate;
      this.fireSniperShot(best, s);
    }
  }

  fireSniperShot(target, spec) {
    const c = this.center;

    // Calculate starting position at the tip of the sniper barrel
    const barrelLength = 35;
    const startX = c.x + Math.cos(this.rot - Math.PI / 2) * barrelLength;
    const startY = c.y + Math.sin(this.rot - Math.PI / 2) * barrelLength;

    // Create sniper bullet
    const bullet = new SniperBullet(
      startX,
      startY,
      this.rot - Math.PI / 2, // Adjust rotation to point forward
      spec
    );
    projectiles.push(bullet);

    // Muzzle flash and smoke
    spawnMuzzle(startX, startY, this.rot - Math.PI / 2, spec.color);
    this.spawnSniperSmoke(startX, startY);

    // Sniper laser sight effect
    this.drawLaserSight(target);
  }

  spawnSniperSmoke(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = this.rot - Math.PI / 2 + (Math.random() - 0.5) * 0.3;
      const speed = 40 + Math.random() * 40;
      const size = 2 + Math.random() * 2;
      const life = 0.8 + Math.random() * 0.4;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        r: size,
        c: "#888888",
        gravity: 0.05,
        fade: 0.93,
        shrink: 0.97,
      });
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;
    const time = performance.now() / 1000;

    // Draw sniper tower base
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Platform border
    ctx.strokeStyle = "#2b4ff2";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();

    // Draw sniper rifle
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    // Rifle body
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.roundRect(-8, -35, 16, 50, 3);
    ctx.fill();

    // Rifle barrel
    ctx.fillStyle = "#2b4ff2";
    ctx.beginPath();
    ctx.roundRect(-4, -50, 8, 15, 2);
    ctx.fill();

    // Rifle scope
    ctx.fillStyle = "#2b4ff2";
    ctx.beginPath();
    ctx.roundRect(-6, -25, 12, 8, 2);
    ctx.fill();

    // Scope lenses
    ctx.fillStyle = "#2b4ff2";
    ctx.beginPath();
    ctx.arc(-6, -21, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2b4ff2";
    ctx.beginPath();
    ctx.arc(6, -21, 3, 0, Math.PI * 2);
    ctx.fill();

    // Scope glow
    const pulse = Math.sin(time * 3) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(0, 150, 255, ${0.4 * pulse})`;
    ctx.beginPath();
    ctx.arc(0, -21, 2, 0, Math.PI * 2);
    ctx.fill();

    // Bipod
    ctx.strokeStyle = "#2b4ff2";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 15);
    ctx.lineTo(-15, 25);
    ctx.moveTo(8, 15);
    ctx.lineTo(15, 25);
    ctx.stroke();

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

    // --- NEW CODE: Display Level as Text for SniperTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
    // --- END NEW CODE ---

    // Draw laser sight when not firing
    if (this.cool > 0.1) {
      this.drawLaserSight();
    }
  }

  drawLaserSight(target = null) {
    const s = this.spec();
    const { x, y } = this.center;
    const angle = this.rot - Math.PI / 2;

    // Calculate laser end point
    let endX, endY;
    if (target) {
      endX = target.pos.x;
      endY = target.pos.y;
    } else {
      // Extend laser to max range if no target
      endX = x + Math.cos(angle) * s.range;
      endY = y + Math.sin(angle) * s.range;
    }

    // Draw laser beam
    ctx.strokeStyle = `rgba(255, 50, 50, 0.4)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(
      x + Math.cos(angle) * 35, // Start at barrel tip
      y + Math.sin(angle) * 35
    );
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw laser dot at end
    if (target) {
      ctx.fillStyle = "rgba(255, 50, 50, 0.6)";
      ctx.beginPath();
      ctx.arc(endX, endY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

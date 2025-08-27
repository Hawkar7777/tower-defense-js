// ===== FILE: src/towers/SniperTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";
import { spawnMuzzle, spawnHit } from "../effects.js";
import { SniperBullet } from "../sniperBullet.js"; // We'll create this special projectile
import { soundManager } from "../assets/sounds/SoundManager.js";
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
    color: "#2b4162", // Base color, but visuals will use more blues/greys
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

  /**
   * Calculates the precise world coordinates from where the projectile should originate.
   * This is at the center of the muzzle opening of the new design.
   * @returns {{x: number, y: number}} The world coordinates for the projectile origin.
   */
  getAttackOrigin() {
    const c = this.center;
    // The muzzle is at local (50, 0) in the new draw method (when this.rot = 0)
    const muzzleCenterOffset = 50;

    // Calculate the position at the center of the muzzle, accounting for rotation.
    // The barrel is drawn horizontally (along local +X axis) when this.rot = 0.
    return {
      x: c.x + Math.cos(this.rot) * muzzleCenterOffset,
      y: c.y + Math.sin(this.rot) * muzzleCenterOffset,
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
      // Calculate rotation to point the barrel (drawn along +X when rot=0) towards the target
      this.rot = Math.atan2(dy, dx);
    }

    // Fire if cooldown is ready and there's a target
    if (this.cool <= 0 && best) {
      this.cool = 1 / s.fireRate;
      this.fireSniperShot(best, s);
    }
  }

  fireSniperShot(target, spec) {
    // Get the precise origin from the barrel tip
    const origin = this.getAttackOrigin();

    // Create sniper bullet
    const bullet = new SniperBullet(
      origin.x,
      origin.y,
      this.rot, // Use tower's rotation directly as it now points forward
      spec
    );
    projectiles.push(bullet);

    // Muzzle flash and smoke at the *true* origin
    spawnMuzzle(origin.x, origin.y, this.rot, spec.color);
    this.spawnSniperSmoke(origin.x, origin.y);

    // Sniper laser sight effect
    this.drawLaserSight(target);
    soundManager.playSound("sniperShoot", 0.2);
  }

  spawnSniperSmoke(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = this.rot + (Math.random() - 0.5) * 0.3; // Spread particles around fire direction
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
        c: "#888888", // Smoke color
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

    ctx.save();
    ctx.translate(x, y);

    // Shadow for depth
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(4, 4, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Sleek Base Platform
    ctx.fillStyle = "#34495e"; // Dark blue-grey
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Base energy lines
    ctx.strokeStyle = `rgba(45, 150, 255, ${0.4 + Math.sin(time * 2) * 0.2})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i + time * 0.1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 15, Math.sin(angle) * 7);
      ctx.lineTo(Math.cos(angle + 0.5) * 22, Math.sin(angle + 0.5) * 10);
      ctx.stroke();
    }

    ctx.save();
    ctx.rotate(this.rot); // Rotate the entire weapon assembly

    // 2. Weapon Mounting Platform
    ctx.fillStyle = "#5d6d7e"; // Medium grey
    ctx.beginPath();
    ctx.roundRect(-10, -10, 20, 20, 5); // Central rotating mount
    ctx.fill();
    ctx.strokeStyle = "#4a5458";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Long Railgun Barrel
    ctx.fillStyle = "#2c3e50"; // Dark gunmetal
    ctx.beginPath();
    ctx.roundRect(-10, -5, 60, 10, 3); // Long barrel extending right (local X+)
    ctx.fill();
    ctx.strokeStyle = "#1a1f21";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Barrel highlights/rails
    ctx.fillStyle = "#4a6c8f"; // Blue-steel accent
    ctx.fillRect(0, -3, 40, 2);
    ctx.fillRect(0, 1, 40, 2);

    // Muzzle tip / energy emitter
    ctx.fillStyle = "#2b4ff2"; // Bright blue
    ctx.beginPath();
    ctx.arc(50, 0, 5, 0, Math.PI * 2); // Muzzle opening
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath();
    ctx.arc(50, 0, 2, 0, Math.PI * 2); // Inner glow
    ctx.fill();

    // 4. Advanced Scope/Targeting Array
    ctx.fillStyle = "#34495e";
    ctx.beginPath();
    ctx.roundRect(10, -15, 15, 10, 3); // Scope housing on top of barrel
    ctx.fill();
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Scope lens
    ctx.fillStyle = "rgba(45, 150, 255, 0.7)"; // Blue lens with reflection
    ctx.beginPath();
    ctx.ellipse(18, -10, 4, 3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(16, -12, 1, 0, Math.PI * 2); // Glare highlight
    ctx.fill();

    ctx.restore(); // End weapon assembly rotation

    // --- Display Level as Text for SniperTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the base platform
    ctx.fillText(`Lv. ${this.level}`, 0, 28);
    // --- END NEW CODE ---

    ctx.restore(); // Restore global context from the first ctx.save()

    // Draw laser sight when not firing
    if (this.cool > 0.1) {
      this.drawLaserSight();
    }
  }

  drawLaserSight(target = null) {
    const s = this.spec();
    const { x, y } = this.center;
    const angle = this.rot; // Laser angle is now directly this.rot

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
      x + Math.cos(angle) * 50, // Start at muzzle tip of new design (local x=50)
      y + Math.sin(angle) * 50
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

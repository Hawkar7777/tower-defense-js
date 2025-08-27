// ===== FILE: src/towers/ArtilleryTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";
import { spawnMuzzle, spawnExplosion } from "../effects.js";
import { ArtilleryShell } from "../artilleryShell.js"; // Special arcing projectile
import { soundManager } from "../assets/sounds/SoundManager.js";

export class ArtilleryTower extends BaseTower {
  static SPEC = {
    name: "Artillery",
    cost: 500,
    range: 350, // Long range
    fireRate: 0.15, // Very slow firing rate
    dmg: 60, // High damage
    splash: 120, // Large splash radius
    bulletSpeed: 150, // Slow projectiles (for arcing)
    arcHeight: 80, // Height of projectile arc
    minRange: 60, // Minimum range to avoid hitting itself
    color: "#8d6e63",
  };

  constructor(gx, gy, key) {
    super(gx, gy, key);
    this.recoilEffect = 0; // Initialize recoil effect
  }

  // Override spec to include artillery properties
  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.5; // Higher multiplier for damage
    return {
      name: base.name,
      range: base.range * (1 + (this.level - 1) * 0.1),
      fireRate: base.fireRate * (1 + (this.level - 1) * 0.08),
      dmg: base.dmg * mult,
      splash: base.splash * (1 + (this.level - 1) * 0.1),
      bulletSpeed: base.bulletSpeed,
      arcHeight: base.arcHeight * (1 + (this.level - 1) * 0.05),
      minRange: base.minRange,
      color: base.color,
      cost: base.cost,
    };
  }

  /**
   * Calculates the precise world coordinates from where the projectile should originate.
   * This is at the center of the muzzle opening.
   * @returns {{x: number, y: number}} The world coordinates for the projectile origin.
   */
  getAttackOrigin() {
    const c = this.center;
    // The muzzle opening is centered at local (55, 0) in the draw method
    const muzzleCenterOffset = 55;
    // Scale recoil effect for visual displacement
    const currentRecoilVisual = this.recoilEffect * 10;

    // Calculate the position at the center of the muzzle, accounting for rotation and recoil.
    // The barrel is drawn horizontally (along local +X axis) when this.rot = 0.
    return {
      x: c.x + Math.cos(this.rot) * (muzzleCenterOffset - currentRecoilVisual),
      y: c.y + Math.sin(this.rot) * (muzzleCenterOffset - currentRecoilVisual),
    };
  }

  update(dt, enemiesList) {
    const s = this.spec();
    this.cool -= dt;
    this.recoilEffect = Math.max(0, this.recoilEffect - dt * 3); // Decay recoil

    // Find best target (prioritize enemies farthest along the path, and in groups)
    let best = null;
    let bestScore = -1;

    for (const e of enemiesList) {
      if (e.dead) continue;
      const p = e.pos;
      const d = dist(this.center, p);

      // Check if in range but not too close (minRange for artillery)
      if (d <= s.range && d >= s.minRange) {
        // Score based on number of enemies near this target (for splash efficiency)
        let nearbyEnemies = 0;
        for (const other of enemiesList) {
          if (other.dead) continue;
          if (dist(p, other.pos) <= s.splash * 0.8) {
            // Consider enemies within a portion of splash radius
            nearbyEnemies++;
          }
        }

        const score = e.t * (1 + nearbyEnemies * 0.3); // Prioritize later enemies with groups

        if (score > bestScore) {
          best = e;
          bestScore = score;
        }
      }
    }

    // If we found a target, aim the turret at it
    if (best) {
      const dx = best.pos.x - this.center.x;
      const dy = best.pos.y - this.center.y;
      // Calculate rotation to point the barrel (drawn along +X when rot=0) towards the target
      this.rot = Math.atan2(dy, dx);
    }

    // Fire if cooldown is ready and there's a target
    if (this.cool <= 0 && best) {
      this.cool = 1 / s.fireRate; // Reset cooldown
      this.fireArtilleryShot(best, s);
    }
  }

  fireArtilleryShot(target, spec) {
    // Get the precise origin from the barrel tip
    const origin = this.getAttackOrigin();

    // Create artillery shell with arc trajectory
    const shell = new ArtilleryShell(
      origin.x,
      origin.y,
      target.pos.x,
      target.pos.y,
      spec
    );
    projectiles.push(shell);

    // Spawn muzzle flash and smoke directly at the projectile's origin
    this.spawnMuzzleBlast(origin.x, origin.y);

    // Apply recoil effect to the tower's drawing
    this.recoilEffect = 0.4;
    soundManager.playSound("artillaryShoot", 0.3);
  }

  spawnMuzzleBlast(x, y) {
    // Large muzzle blast for artillery
    for (let i = 0; i < 15; i++) {
      const angle = this.rot + (Math.random() - 0.5) * 0.5; // Spread particles around fire direction
      const speed = 60 + Math.random() * 60;
      const size = 4 + Math.random() * 3;
      const life = 1.2 + Math.random() * 0.5;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        r: size,
        c: "#666", // Smoke color
        gravity: 0.2,
        fade: 0.9,
        shrink: 0.95,
      });
    }

    // Flash particles
    for (let i = 0; i < 8; i++) {
      const angle = this.rot + (Math.random() - 0.5) * 0.3;
      const speed = 120 + Math.random() * 120;
      const size = 2 + Math.random() * 2;
      const life = 0.3 + Math.random() * 0.2;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        r: size,
        c: "#ff8c00", // Orange flash color
        fade: 0.95,
      });
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;
    const time = performance.now() / 1000;
    const currentRecoilVisual = this.recoilEffect * 10; // Scale recoil for drawing

    ctx.save();
    ctx.translate(x, y);

    // Shadow for depth
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(4, 4, 30, 20, 0, 0, Math.PI * 2); // Large, oval shadow for a bigger base
    ctx.fill();

    // Base (sturdy, low profile carriage with wheels/tracks)
    ctx.fillStyle = "#4a4a4a"; // Darker grey for a more realistic military vehicle
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#2c2c2c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Wheels/Tracks (simplified as circles)
    ctx.fillStyle = "#333333";
    ctx.beginPath();
    ctx.arc(-20, 15, 8, 0, Math.PI * 2);
    ctx.arc(20, 15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-20, 15, 8, 0, Math.PI * 2);
    ctx.arc(20, 15, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    // Apply recoil translation to the entire rotating turret assembly
    // The translation direction is opposite to the barrel's firing direction (this.rot).
    ctx.translate(
      -Math.cos(this.rot) * currentRecoilVisual,
      -Math.sin(this.rot) * currentRecoilVisual
    );

    ctx.rotate(this.rot); // Rotate the entire turret and barrel assembly

    // Turret Mount/Shield (part that rotates with the barrel)
    ctx.fillStyle = "#6d6d6d"; // Medium grey
    ctx.beginPath();
    // Adjusted rectangle to be centered relative to the barrel's pivot
    // The barrel is drawn from x=-10, so the pivot is around x=0
    ctx.roundRect(-15, -20, 30, 40, 8); // Wider, more substantial shield/mount
    ctx.fill();
    ctx.strokeStyle = "#4a4a4a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-15, -20, 30, 40, 8);
    ctx.stroke();

    // Long Barrel
    ctx.fillStyle = "#5d5d5d"; // Darker grey for barrel
    ctx.beginPath();
    // Barrel now extends along the local +X axis, from x=-10 to x=55
    ctx.roundRect(-10, -8, 65, 16, 4); // Longer, thicker barrel
    ctx.fill();

    ctx.strokeStyle = "#3a3a3a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(55, -8);
    ctx.moveTo(-10, 8);
    ctx.lineTo(55, 8);
    ctx.stroke();

    // Muzzle Brake
    ctx.fillStyle = "#4a4a4a";
    ctx.beginPath();
    // Muzzle brake at the very end of the barrel (local x=55)
    ctx.roundRect(50, -10, 8, 20, 3);
    ctx.fill();

    // Muzzle opening (dark) - positioned at local (55, 0)
    ctx.fillStyle = "#222222";
    ctx.beginPath();
    ctx.arc(55, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Commander's Hatch/Scope (on the turret, adjusted for new barrel position)
    ctx.fillStyle = "#4a4a4a";
    ctx.beginPath();
    ctx.arc(0, -10, 8, 0, Math.PI * 2); // Positioned further back on the turret
    ctx.fill();
    ctx.strokeStyle = "#2c2c2c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -10, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(100, 150, 255, 0.5)"; // Blue scope lens
    ctx.beginPath();
    ctx.arc(0, -10, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // End recoil and rotation from ctx.save() before `ctx.rotate(this.rot)`

    // --- Display Level as Text for ArtilleryTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower base
    ctx.fillText(`Lv. ${this.level}`, 0, 35);
    // --- END NEW CODE ---

    ctx.restore(); // Restore global context from the first ctx.save()

    // Idle smoke puffs (adjusted for new barrel tip position)
    if (Math.random() < 0.02) {
      this.drawIdleSmoke(x, y, time);
    }
  }

  /**
   * Draws idle smoke from the barrel tip, accounting for rotation and recoil.
   * @param {number} x - Center X of the tower.
   * @param {number} y - Center Y of the tower.
   * @param {number} time - Current game time for animation.
   */
  drawIdleSmoke(x, y, time) {
    const angle = this.rot; // Direction the barrel is pointing (now directly this.rot)
    const muzzleCenterOffset = 55; // Muzzle opening is at local (55, 0)
    const currentRecoilVisual = this.recoilEffect * 10; // Current recoil displacement

    // Calculate the world coordinates of the muzzle opening
    const muzzleX =
      x + Math.cos(angle) * (muzzleCenterOffset - currentRecoilVisual);
    const muzzleY =
      y + Math.sin(angle) * (muzzleCenterOffset - currentRecoilVisual);

    for (let i = 0; i < 4; i++) {
      const offset = (Math.random() - 0.5) * 5; // Slight random spread perpendicular to barrel
      // To get a perpendicular offset, add/subtract PI/2 from the barrel's angle
      const perpAngle = angle + Math.PI / 2;

      const life = 0.8 + Math.random() * 0.5;
      const size = 2 + Math.random() * 2;

      particles.push({
        x: muzzleX + Math.cos(perpAngle) * offset,
        y: muzzleY + Math.sin(perpAngle) * offset,
        vx: Math.cos(angle) * 20 + (Math.random() - 0.5) * 10, // Smoke moves generally forward from barrel
        vy: Math.sin(angle) * 20 + (Math.random() - 0.5) * 10,
        life,
        r: size,
        c: "#888", // Smoke color
        gravity: -0.05, // Slight upward drift for smoke
        fade: 0.95,
      });
    }
  }
}

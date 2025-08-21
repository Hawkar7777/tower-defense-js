// ===== FILE: src/towers/ArtilleryTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";
import { spawnMuzzle, spawnExplosion } from "../effects.js";
import { ArtilleryShell } from "../artilleryShell.js"; // Special arcing projectile

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

  update(dt, enemiesList) {
    const s = this.spec();
    this.cool -= dt;

    // Find best target (prioritize groups of enemies)
    let best = null;
    let bestScore = -1;

    for (const e of enemiesList) {
      if (e.dead) continue;
      const p = e.pos;
      const d = dist(this.center, p);

      // Check if in range but not too close
      if (d <= s.range && d >= s.minRange) {
        // Score based on number of enemies near this target
        let nearbyEnemies = 0;
        for (const other of enemiesList) {
          if (other.dead) continue;
          if (dist(p, other.pos) <= s.splash * 0.8) {
            nearbyEnemies++;
          }
        }

        const score = e.t * (1 + nearbyEnemies * 0.3); // Prefer later enemies with groups

        if (score > bestScore) {
          best = e;
          bestScore = score;
        }
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
      this.fireArtilleryShot(best, s);
    }
  }

  fireArtilleryShot(target, spec) {
    const c = this.center;

    // Calculate starting position at the mortar barrel
    const barrelLength = 25;
    const startX = c.x + Math.cos(this.rot - Math.PI / 2) * barrelLength;
    const startY = c.y + Math.sin(this.rot - Math.PI / 2) * barrelLength;

    // Create artillery shell with arc trajectory
    const shell = new ArtilleryShell(
      startX,
      startY,
      target.pos.x,
      target.pos.y,
      spec
    );
    projectiles.push(shell);

    // Muzzle flash and smoke
    this.spawnMuzzleBlast(startX, startY);

    // Recoil effect
    this.recoilEffect = 0.4;
  }

  spawnMuzzleBlast(x, y) {
    // Large muzzle blast for artillery
    for (let i = 0; i < 15; i++) {
      const angle = this.rot - Math.PI / 2 + (Math.random() - 0.5) * 0.5;
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
        c: "#666",
        gravity: 0.2,
        fade: 0.9,
        shrink: 0.95,
      });
    }

    // Flash
    for (let i = 0; i < 8; i++) {
      const angle = this.rot - Math.PI / 2 + (Math.random() - 0.5) * 0.3;
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
        c: "#ff8c00",
        fade: 0.95,
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
    ctx.arc(4, 4, 24, 0, Math.PI * 2);
    ctx.fill();

    // Base platform
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#4e342e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();

    // Layered bolts / metallic trim
    ctx.fillStyle = "#b0bec5";
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const bx = Math.cos(angle) * 16;
      const by = Math.sin(angle) * 16;
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    // Apply recoil
    if (this.recoilEffect > 0) {
      ctx.translate(0, this.recoilEffect * 4);
      this.recoilEffect -= 0.03;
    }

    ctx.rotate(this.rot);

    // Turret mount
    ctx.fillStyle = "#4e342e";
    ctx.beginPath();
    ctx.roundRect(-18, -8, 36, 16, 4);
    ctx.fill();

    // Barrel base
    ctx.fillStyle = "#6d4c41";
    ctx.beginPath();
    ctx.roundRect(-10, -20, 20, 12, 3);
    ctx.fill();

    // Barrel with highlights
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    ctx.roundRect(-8, -45, 16, 30, 4);
    ctx.fill();

    ctx.strokeStyle = "#3e2723";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, -45);
    ctx.lineTo(-8, -15);
    ctx.moveTo(8, -45);
    ctx.lineTo(8, -15);
    ctx.stroke();

    // Barrel tip glow
    ctx.fillStyle = "#ff8c00";
    ctx.beginPath();
    ctx.roundRect(-7, -50, 14, 8, 3);
    ctx.fill();

    // Aiming gear
    ctx.fillStyle = "#3e2723";
    ctx.beginPath();
    ctx.arc(0, -15, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Level indicators as explosive icons
    for (let i = 0; i < this.level; i++) {
      const ix = x - 12 + i * 6;
      const iy = y + 28;

      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(ix, iy, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let j = 0; j < 8; j++) {
        const angle = (j * Math.PI * 2) / 8;
        ctx.moveTo(ix + Math.cos(angle) * 2, iy + Math.sin(angle) * 2);
        ctx.lineTo(ix + Math.cos(angle) * 4, iy + Math.sin(angle) * 4);
      }
      ctx.stroke();
    }

    ctx.restore();

    // Idle smoke puffs
    if (Math.random() < 0.02) {
      this.drawIdleSmoke(x, y, time);
    }
  }

  drawIdleSmoke(x, y, time) {
    const angle = this.rot - Math.PI / 2;
    const barrelTipX = x + Math.cos(angle) * 45;
    const barrelTipY = y + Math.sin(angle) * 45;

    for (let i = 0; i < 4; i++) {
      const offset = (Math.random() - 0.5) * 5;
      const life = 0.8 + Math.random() * 0.5;
      const size = 2 + Math.random() * 2;

      particles.push({
        x: barrelTipX + Math.cos(angle + Math.PI / 2) * offset,
        y: barrelTipY + Math.sin(angle + Math.PI / 2) * offset,
        vx: Math.cos(angle) * 20 + (Math.random() - 0.5) * 10,
        vy: Math.sin(angle) * 20 + (Math.random() - 0.5) * 10 - 10,
        life,
        r: size,
        c: "#888",
        gravity: -0.1,
        fade: 0.95,
      });
    }
  }
}

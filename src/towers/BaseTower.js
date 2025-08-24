import { ctx } from "../core.js";
import { dist } from "../utils.js";
import { spawnMuzzle } from "../effects.js";
import { projectiles } from "../state.js";
import { Bullet } from "../bullet.js";
import { roundRect } from "../helpers.js";

export class BaseTower {
  constructor(gx, gy, key) {
    this.gx = gx;
    this.gy = gy;
    this.key = key;
    this.level = 1;
    this.cool = 0;
    this.rot = 0;

    // --- ADDITION 1: Properties for Warlock's Hex ability ---
    this.isHexed = false;
    this.hexTimer = 0;
  }

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.35;
    return {
      name: base.name,
      range: base.range * (1 + (this.level - 1) * 0.08),
      fireRate: base.fireRate * (1 + (this.level - 1) * 0.05),
      dmg: base.dmg * mult,
      bulletSpeed: base.bulletSpeed,
      splash: base.splash || 0,
      beam: base.beam || false,
      color: base.color,
      cost: base.cost,
    };
  }

  get center() {
    return { x: this.gx * 40 + 20, y: this.gy * 40 + 20 };
  }

  // --- ADDITION 2: Getters needed by the Warlock ---
  // Simple coordinate access
  get x() {
    return this.gx * 40 + 20;
  }
  get y() {
    return this.gy * 40 + 20;
  }

  // Calculates the total money spent on this tower (base cost + all upgrades)
  // The Warlock uses this to find the most valuable target.
  get totalCost() {
    const baseCost = this.constructor.SPEC.cost;
    let total = baseCost;
    for (let i = 1; i < this.level; i++) {
      total += Math.round(baseCost * (0.75 + i * 0.75));
    }
    return total;
  }

  upgradeCost() {
    return Math.round(this.spec().cost * (0.75 + this.level * 0.75));
  }

  sellValue() {
    // Correctly calculate sell value based on total cost
    return this.totalCost * 0.7;
  }

  update(dt, enemiesList) {
    // --- ADDITION 3: Check if the tower is Hexed (stunned) ---
    if (this.isHexed) {
      this.hexTimer -= dt;
      if (this.hexTimer <= 0) {
        this.isHexed = false;
      }
      return; // Stop all other logic for this frame if hexed
    }
    // --- END OF HEX CHECK ---

    const s = this.spec();
    this.cool -= dt;
    let best = null,
      bestScore = -1;

    for (const e of enemiesList) {
      if (e.dead) continue;
      const p = e.pos;
      const d = dist(this.center, p);
      if (d <= s.range && e.t > bestScore) {
        best = e;
        bestScore = e.t;
      }
    }

    if (!best) return;
    const c = this.center,
      bp = best.pos;
    this.rot = Math.atan2(bp.y - c.y, bp.x - c.x);

    if (s.beam) {
      const dps = s.dmg * 60;
      if (this.cool <= 0) {
        best.damage(dps * dt);
        this.fireBeam(c, bp, s.color);
      }
      return;
    }

    if (this.cool <= 0) {
      this.cool = 1 / s.fireRate;
      this.fireProjectile(c, best, s);
    }
  }

  fireProjectile(center, target, spec) {
    projectiles.push(new Bullet(center.x, center.y, target, spec));
    spawnMuzzle(center.x, center.y, this.rot, spec.color);
  }

  fireBeam(start, end, color) {
    // This will be implemented in the LaserTower class
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;

    roundRect(x - 16, y - 16, 32, 32, 8, "#0e1626", true, "#223c62");

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);
    ctx.fillStyle = s.color;

    // Default single barrel
    roundRect(-8, -8, 16, 16, 4, s.color, true);

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, -3, 14, 6); // muzzle indicator
    ctx.restore();

    for (let i = 0; i < this.level; i++) {
      ctx.fillStyle = s.color;
      ctx.fillRect(x - 10 + i * 6, y + 18, 4, 4);
    }

    // --- ADDITION 4: Draw a visual effect when Hexed ---
    if (this.isHexed) {
      ctx.fillStyle = "rgba(80, 200, 120, 0.4)"; // Sickly green aura
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();

      // Add a swirling particle effect for extra flair
      const time = performance.now() / 100;
      for (let i = 0; i < 3; i++) {
        const angle = time + i * ((Math.PI * 2) / 3);
        const pX = x + Math.cos(angle) * 18;
        const pY = y + Math.sin(angle) * 18;
        ctx.fillStyle = "#50c878"; // Emerald Green particles
        ctx.beginPath();
        ctx.arc(pX, pY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // --- END OF HEX VISUAL ---
  }
}

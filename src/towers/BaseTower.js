// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\BaseTower.js =====

import { ctx } from "../core.js";
import { dist } from "../utils.js";
import { spawnMuzzle } from "../effects.js";
import { projectiles } from "../state.js";
import { Bullet } from "../bullet.js";
import { roundRect } from "../helpers.js";
import { TOWER_TYPES } from "../config.js";

export class BaseTower {
  constructor(gx, gy, key) {
    this.gx = gx;
    this.gy = gy;
    this.key = key;
    this.level = 1;
    this.cool = 0;
    this.rot = 0;

    const baseSpec = TOWER_TYPES[this.key];
    this.hp = baseSpec.hp;
    this.maxHp = baseSpec.hp;

    // Property for Basilisk's slowing aura
    this.slowMultiplier = 1;

    // --- NEW: Property for Disruptor's miss aura ---
    // This will be modified by the Disruptor enemy.
    this.missChance = 0;

    this.isHexed = false;
    this.hexTimer = 0;
  }

  spec() {
    const baseSpec = TOWER_TYPES[this.key];
    this.maxHp = baseSpec.hp * (1 + (this.level - 1) * 0.25);
    return {
      ...baseSpec,
      range: baseSpec.range * (1 + (this.level - 1) * 0.08),
      fireRate: baseSpec.fireRate * (1 + (this.level - 1) * 0.05),
      dmg: baseSpec.dmg * (1 + (this.level - 1) * 0.35),
      hp: this.maxHp,
    };
  }

  get center() {
    return { x: this.gx * 40 + 20, y: this.gy * 40 + 20 };
  }

  get x() {
    return this.gx * 40 + 20;
  }
  get y() {
    return this.gy * 40 + 20;
  }

  get totalCost() {
    const baseCost = TOWER_TYPES[this.key].cost;
    let total = baseCost;
    for (let i = 1; i < this.level; i++) {
      total += Math.round(baseCost * (0.75 + i * 0.75));
    }
    return total;
  }

  upgradeCost() {
    const baseCost = TOWER_TYPES[this.key].cost;
    return Math.round(baseCost * (0.75 + this.level * 0.75));
  }

  sellValue() {
    return this.totalCost * 0.7;
  }

  onUpgrade() {
    this.spec();
    this.hp = this.maxHp;
  }

  update(dt, enemiesList) {
    if (this.isHexed) {
      this.hexTimer -= dt;
      if (this.hexTimer <= 0) {
        this.isHexed = false;
      }
      return;
    }

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
      this.cool = 1 / (s.fireRate * this.slowMultiplier);
      // The return value of fireProjectile is not used here,
      // but it's important for derived classes that override it.
      this.fireProjectile(c, best, s);
    }
  }

  /**
   * Fires a projectile at a target, now with a chance to miss.
   * @param {{x: number, y: number}} center - The starting position of the projectile.
   * @param {BaseEnemy} target - The enemy to fire at.
   * @param {object} spec - The tower's current stats.
   * @returns {boolean} True if a projectile was successfully launched, false if it missed.
   */
  fireProjectile(center, target, spec) {
    // --- MODIFIED: Check for the miss chance and return false if missed ---
    if (this.missChance > 0 && Math.random() < this.missChance) {
      // The shot misses!
      spawnMuzzle(center.x, center.y, this.rot, "#ff5555"); // Red fizzle effect
      return false; // Indicate that no projectile was launched
    }

    // If the check passes, fire the projectile normally.
    projectiles.push(new Bullet(center.x, center.y, target, spec));
    spawnMuzzle(center.x, center.y, this.rot, spec.color); // Normal muzzle effect
    return true; // Indicate that a projectile was successfully launched
  }

  fireBeam(start, end, color) {
    // To be implemented in LaserTower
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;

    roundRect(x - 16, y - 16, 32, 32, 8, "#0e1626", true, "#223c62");

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);
    ctx.fillStyle = s.color;
    roundRect(-8, -8, 16, 16, 4, s.color, true);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, -3, 14, 6);
    ctx.restore();

    // --- NEW CODE: Display Level as Text ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
    // --- END NEW CODE ---

    if (this.isHexed) {
      ctx.fillStyle = "rgba(80, 200, 120, 0.4)";
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();

      const time = performance.now() / 100;
      for (let i = 0; i < 3; i++) {
        const angle = time + i * ((Math.PI * 2) / 3);
        const pX = x + Math.cos(angle) * 18;
        const pY = y + Math.sin(angle) * 18;
        ctx.fillStyle = "#50c878";
        ctx.beginPath();
        ctx.arc(pX, pY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

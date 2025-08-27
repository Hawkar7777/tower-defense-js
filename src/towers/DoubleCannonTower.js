import { BaseTower } from "./BaseTower.js";
import { projectiles } from "../state.js";
import { spawnMuzzle } from "../effects.js";
import { Bullet } from "../bullet.js";
import { ctx } from "../core.js";
import { soundManager } from "../assets/sounds/SoundManager.js";
import { dist } from "../utils.js";

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

  constructor(gx, gy, key) {
    super(gx, gy, key);
    this._s = {
      muzzleFlashEffect1: 0,
      muzzleFlashEffect2: 0,
      barrelToFire: 0, // 0 for top, 1 for bottom, alternate
    };
    // Removed: this.shootSound = new Audio(...) and related properties
  }

  // Removed: playShootSound method

  fireProjectile(center, target, spec) {
    // Check for the miss chance first, inherited from BaseTower
    if (this.missChance > 0 && Math.random() < this.missChance) {
      // The shot misses! Spawn a red "fizzle" effect at the tower's center.
      spawnMuzzle(center.x, center.y, this.rot, "#ff5555");
      return false; // Indicate that no projectiles were launched
    }

    const offset = 8; // Distance of each barrel from the center line
    const barrelLength = 22; // The visual length of the barrel from the turret pivot
    const sin = Math.sin(this.rot);
    const cos = Math.cos(this.rot);

    // Calculate the exact tip position of each barrel
    const muzzle1X = center.x + cos * barrelLength - sin * offset;
    const muzzle1Y = center.y + sin * barrelLength + cos * offset;
    const muzzle2X = center.x + cos * barrelLength + sin * offset;
    const muzzle2Y = center.y + sin * barrelLength - cos * offset;

    // Fire one projectile from the tip of each barrel
    projectiles.push(new Bullet(muzzle1X, muzzle1Y, target, spec));
    projectiles.push(new Bullet(muzzle2X, muzzle2Y, target, spec)); // Corrected typo here from muuzzle2X

    // Spawn muzzle flash at the same barrel tip positions
    spawnMuzzle(muzzle1X, muzzle1Y, this.rot, spec.color);
    spawnMuzzle(muzzle2X, muzzle2Y, this.rot, spec.color);

    // Use the sound manager to play the sound
    soundManager.playSound("doubleCannonShoot", 0.4); // Play sound via manager with specific volume

    return true; // Indicate that projectiles were successfully launched
  }

  update(dt, enemiesList) {
    const s = this.spec();
    this.cool -= dt;

    // Decay muzzle flash effects for both barrels
    this._s.muzzleFlashEffect1 = Math.max(
      0,
      this._s.muzzleFlashEffect1 - dt * 5
    );
    this._s.muzzleFlashEffect2 = Math.max(
      0,
      this._s.muzzleFlashEffect2 - dt * 5
    );

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

    if (this.cool <= 0) {
      this.cool = 1 / (s.fireRate * this.slowMultiplier);
      this.fireProjectile(c, best, s);
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    ctx.fillStyle = "#555555";
    ctx.beginPath();
    ctx.roundRect(-15, -15, 30, 30, 8); // Base
    ctx.fill();

    ctx.fillStyle = "#333333";
    // Top Barrel
    ctx.beginPath();
    ctx.roundRect(0, -10, 30, 8, 4);
    ctx.fill();
    // Bottom Barrel
    ctx.beginPath();
    ctx.roundRect(0, 2, 30, 8, 4);
    ctx.fill();

    // Muzzle flashes for each barrel
    // You'd integrate more sophisticated muzzle flash drawing here
    if (this._s.muzzleFlashEffect1 > 0) {
      // Draw muzzle flash for top barrel
      // Similar logic as GunTower's muzzle flash, but offset for top barrel
    }
    if (this._s.muzzleFlashEffect2 > 0) {
      // Draw muzzle flash for bottom barrel
      // Similar logic as GunTower's muzzle flash, but offset for bottom barrel
    }

    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
  }

  drawCannonBarrel(yOffset, recoil, color) {
    ctx.save();
    ctx.translate(-10 - recoil, yOffset);

    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(0, -6, 8, 12);

    const barrelGradient = ctx.createLinearGradient(0, -5, 0, 5);
    barrelGradient.addColorStop(0, "#bababa");
    barrelGradient.addColorStop(0.5, "#fdfdfd");
    barrelGradient.addColorStop(1, "#bababa");
    ctx.fillStyle = barrelGradient;
    ctx.fillRect(8, -5, 24, 10);

    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(32, -6, 4, 12);
    ctx.fillRect(28, -7, 4, 2);
    ctx.fillRect(28, 5, 4, 2);

    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.arc(36, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.fillRect(10, -6, 3, 12);
    ctx.fillRect(20, -6, 3, 12);

    ctx.restore();
  }
}

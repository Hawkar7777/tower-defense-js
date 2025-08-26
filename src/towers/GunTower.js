import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js"; // Import ctx
import { Bullet } from "../bullet.js";
import { projectiles, particles } from "../state.js"; // Ensure particles is imported
import { dist, clamp } from "../utils.js"; // Ensure dist and clamp are imported
import { spawnMuzzle } from "../effects.js"; // Import spawnMuzzle

export class GunTower extends BaseTower {
  constructor(gx, gy, key) {
    super(gx, gy, key);
    // Initialize specific state for visual effects like muzzle flash
    this._s = {
      muzzleFlashEffect: 0,
    };
  }

  // Override fireProjectile to spawn from the barrel tip
  fireProjectile(center, target, spec) {
    // Barrel length from the turret center (adjust based on draw method)
    const barrelTipOffset = 18;

    // Calculate the precise origin at the tip of the barrel
    const startX = center.x + Math.cos(this.rot) * barrelTipOffset;
    const startY = center.y + Math.sin(this.rot) * barrelTipOffset;

    // --- NEW: Check for the miss chance from the Disruptor's aura ---
    if (this.missChance > 0 && Math.random() < this.missChance) {
      // The shot misses! Spawn a red "fizzle" effect.
      spawnMuzzle(startX, startY, this.rot, "#ff5555");
      return;
    }

    projectiles.push(new Bullet(startX, startY, target, spec));
    spawnMuzzle(startX, startY, this.rot, spec.color); // Muzzle flash at barrel tip

    // Trigger visual muzzle flash for the draw method
    this._s.muzzleFlashEffect = 1;
  }

  update(dt, enemiesList) {
    const s = this.spec();
    this.cool -= dt;

    // Decay muzzle flash effect
    this._s.muzzleFlashEffect = Math.max(0, this._s.muzzleFlashEffect - dt * 5);

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
    // Aim the gun (this.rot is used directly in draw and fireProjectile)
    this.rot = Math.atan2(bp.y - c.y, bp.x - c.x);

    // No beam logic for GunTower, so we can remove that part
    // if (s.beam) { ... }

    if (this.cool <= 0) {
      this.cool = 1 / (s.fireRate * this.slowMultiplier);
      this.fireProjectile(c, best, s);
    }
  }

  // Custom draw method for the GunTower
  draw() {
    const s = this.spec();
    const { x, y } = this.center;
    const time = performance.now();

    // 1. Sturdy Base Plate
    ctx.fillStyle = "#34495e"; // Dark blue-grey
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 8, 20, 0, Math.PI * 2); // Slightly offset to look like a ground plate
    ctx.fill();
    ctx.stroke();

    // 2. Rotating Turret Body
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot); // Rotate the entire turret assembly

    ctx.fillStyle = "#636e72"; // Medium grey for turret
    ctx.beginPath();
    ctx.roundRect(-10, -10, 20, 20, 5); // Main turret block
    ctx.fill();
    ctx.strokeStyle = "#4a5458";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Machine Gun Barrel
    ctx.fillStyle = "#2d3436"; // Dark gunmetal
    ctx.beginPath();
    ctx.roundRect(0, -3, 20, 6, 2); // Barrel extending to the right (local X+)
    ctx.fill();
    ctx.strokeStyle = "#1a1f21";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. Muzzle Brake/Tip
    ctx.fillStyle = "#2d3436";
    ctx.beginPath();
    ctx.roundRect(18, -4, 4, 8, 1);
    ctx.fill();

    // 5. Muzzle Flash Effect (visual only, for the draw loop)
    if (this._s.muzzleFlashEffect > 0) {
      const flashStrength = this._s.muzzleFlashEffect;
      ctx.save();
      ctx.translate(22, 0); // At the very tip of the barrel
      ctx.globalCompositeOperation = "lighter"; // Blending mode for glow

      // Outer glow
      const outerGrad = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        15 * flashStrength
      );
      outerGrad.addColorStop(0, `rgba(255, 170, 0, ${0.8 * flashStrength})`);
      outerGrad.addColorStop(1, "rgba(255, 170, 0, 0)");
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 15 * flashStrength, 0, Math.PI * 2);
      ctx.fill();

      // Inner core
      const innerGrad = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        8 * flashStrength
      );
      innerGrad.addColorStop(0, `rgba(255, 255, 200, ${flashStrength})`);
      innerGrad.addColorStop(1, `rgba(255, 200, 100, ${0.5 * flashStrength})`);
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 8 * flashStrength, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // End muzzle flash save
      ctx.globalCompositeOperation = "source-over"; // Reset blend mode
    }

    ctx.restore(); // End turret rotation save

    // 6. Display Level as Text
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the base plate
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
  }
}

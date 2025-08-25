// Filename: Basilisk.js

import { BaseBoss } from "./BaseBoss.js";
import { BOSS_TYPES } from "./boss-types.js";
import { state, towers } from "../state.js";
import { dist } from "../utils.js";
import { ctx } from "../core.js";

export class Basilisk extends BaseBoss {
  constructor(difficultyMult) {
    const spec = BOSS_TYPES.Basilisk;
    super(spec, difficultyMult);

    // --- FIX 1: Add a safeguard for the slowFactor ---
    // If the value from the config is missing, invalid, or >= 1,
    // default to 0.5 (a 50% slow). This makes the code safer.
    this.auraRange = spec.auraRange || 150; // Also safeguard the range
    this.slowFactor =
      spec.slowFactor && spec.slowFactor < 1 ? spec.slowFactor : 0.5;

    this.affectedTowers = new Set();
  }

  update(dt) {
    super.update(dt);
    if (this.dead) {
      return; // Cleanup is now handled by the new cleanup() method
    }
    this.applyAura();
  }

  applyAura() {
    const newlyAffected = new Set();
    for (const tower of towers) {
      if (dist(this.pos, tower.center) <= this.auraRange) {
        newlyAffected.add(tower);
      }
    }
    for (const tower of this.affectedTowers) {
      if (!newlyAffected.has(tower)) {
        tower.slowMultiplier = 1;
      }
    }
    for (const tower of newlyAffected) {
      tower.slowMultiplier = this.slowFactor;
    }
    this.affectedTowers = newlyAffected;
  }

  // --- FIX 2: Create a dedicated cleanup method ---
  // This will be called by BaseBoss when the boss dies, ensuring
  // the aura is always removed correctly.
  cleanup() {
    for (const tower of this.affectedTowers) {
      tower.slowMultiplier = 1; // Reset speed
    }
    this.affectedTowers.clear();
  }

  // Draw method remains the same...
  draw() {
    super.draw();
    if (this.dead) return; // Add a safety check here
    const { x, y } = this.pos;
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(x, y, this.auraRange, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.animationOffset);
    for (let i = 0; i < 6; i++) {
      ctx.rotate((Math.PI * 2) / 6);
      ctx.fillStyle = this.detailColor;
      ctx.beginPath();
      ctx.arc(0, this.r * 0.7, this.r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.arc(0, this.r * 0.6, this.r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    const eyeDist = this.r * 0.5;
    for (let i = -1; i <= 1; i += 2) {
      const eyeX = x + Math.cos(this.animationOffset * 0.5) * eyeDist * i;
      const eyeY = y + Math.sin(this.animationOffset * 0.5) * eyeDist * i;
      ctx.fillStyle = this.glowColor;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, this.r * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, this.r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

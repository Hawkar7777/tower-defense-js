// Filename: Basilisk.js

import { BaseBoss } from "./BaseBoss.js";
import { BOSS_TYPES } from "./boss-types.js";
import { state, towers } from "../state.js";
import { dist } from "../utils.js";
import { ctx } from "../core.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

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

  damage(d) {
    if (this.dead) return;

    super.damage(d); // apply normal HP reduction

    // Play hit sound
    soundManager.playSound("baslikHit", 0.3);
  }

  update(dt) {
    super.update(dt);
    if (this.dead) {
      return; // Cleanup is now handled by the new cleanup() method
    }
    // 🔊 Play move sound only if Basilisk is moving
    // Play sound once per step or use a looped sound
    soundManager.playSound("baslikAura", 0.3);
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

  draw() {
    super.draw();
    if (this.dead) return;
    const { x, y } = this.pos;

    // --- Aura circle ---
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(x, y, this.auraRange, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // --- Body ---
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Health bar above Basilisk ---
    const w = 60,
      h = 6;
    const barY = y - this.r - 20;
    ctx.fillStyle = "#202326";
    ctx.fillRect(x - w / 2 - 1, barY - 1, w + 2, h + 2); // bezel
    ctx.fillStyle = "#111418";
    ctx.fillRect(x - w / 2, barY, w, h); // dark background
    const hpPercent = Math.max(0, this.hp / this.maxHp);
    const healthGrad = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    if (hpPercent > 0.5) {
      healthGrad.addColorStop(0, "#46d46a");
      healthGrad.addColorStop(1, "#7be08d");
    } else if (hpPercent > 0.25) {
      healthGrad.addColorStop(0, "#fdc04a");
      healthGrad.addColorStop(1, "#f8a63a");
    } else {
      healthGrad.addColorStop(0, "#f66a6a");
      healthGrad.addColorStop(1, "#ff4a4a");
    }
    ctx.fillStyle = healthGrad;
    ctx.fillRect(x - w / 2, barY, w * hpPercent, h);

    // --- HP number under the bar ---
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.fillText(
      Math.ceil(this.hp) + " / " + Math.ceil(this.maxHp),
      x,
      barY + h + 12
    );

    // --- Decorative details (rotating spikes) ---
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

    // --- Eyes ---
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

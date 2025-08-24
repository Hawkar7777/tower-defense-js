// ===== FILE: Boss/Warlock.js =====

import { ctx } from "../core.js";
import { clamp } from "../utils.js";
import { state, towers } from "../state.js"; // 'towers' is already imported, which is great!
import { BaseBoss } from "./BaseBoss.js";
import { BOSS_TYPES } from "./boss-types.js";

export class warlock extends BaseBoss {
  constructor() {
    const bossType = BOSS_TYPES.Warlock;
    const difficultyMult = 1 + state.wave * 0.15;
    super(bossType, difficultyMult);

    this.hexTarget = null;
    this.hexRange = 300;
    this.hexDuration = 5;
    this.hexCooldown = 8000;
    this.lastHexTime = -this.hexCooldown;

    this.siphonHealAmount = 300 * difficultyMult;
  }

  findHexTarget() {
    let bestTarget = null;
    let maxCost = 0;

    for (const tower of towers) {
      const d = Math.hypot(this.pos.x - tower.x, this.pos.y - tower.y);
      if (d < this.hexRange && !tower.isHexed) {
        if (tower.totalCost > maxCost) {
          maxCost = tower.totalCost;
          bestTarget = tower;
        }
      }
    }
    return bestTarget;
  }

  update(dt) {
    super.update(dt);
    if (this.dead) return;

    // --- FIX: Add this block to validate the target ---
    // First, check if the current target is still valid (i.e., hasn't been sold).
    // The .includes() check is an efficient way to see if the tower is still in the game.
    if (this.hexTarget && !towers.includes(this.hexTarget)) {
      this.hexTarget = null; // Forget the sold tower.
    }
    // --- END OF FIX ---

    const now = performance.now();
    if (now - this.lastHexTime > this.hexCooldown) {
      // Only search for a new target if we don't currently have one.
      if (!this.hexTarget) {
        const target = this.findHexTarget();
        if (target) {
          this.hexTarget = target;
          this.hexTarget.isHexed = true;
          this.hexTarget.hexTimer = this.hexDuration;
          this.lastHexTime = now;
          this.hp = Math.min(this.maxHp, this.hp + this.siphonHealAmount);
        }
      }
    }

    // This handles the case where the hex effect wears off naturally.
    if (this.hexTarget && this.hexTarget.isHexed === false) {
      this.hexTarget = null;
    }
  }

  draw() {
    if (this.dead) return;
    const { x, y } = this.pos;
    const TAU = Math.PI * 2;

    // The Hex Beam will now correctly stop drawing when the target is null.
    if (this.hexTarget) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(this.hexTarget.x, this.hexTarget.y);
      ctx.strokeStyle = this.detailColor;
      ctx.lineWidth = 3 + Math.sin(performance.now() / 100);
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // The rest of the draw function remains the same.
    const grd = ctx.createRadialGradient(x, y, this.r * 0.2, x, y, this.r);
    grd.addColorStop(0, "#fff");
    grd.addColorStop(0.5, this.glowColor);
    grd.addColorStop(1, this.color);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const rotation = this.animationOffset + i * (TAU / 3);
      ctx.beginPath();
      ctx.ellipse(x, y, this.r * 0.5, this.r * 1.2, rotation, 0, TAU);
      ctx.stroke();
    }

    const w = 55,
      h = 6;
    const barY = y - this.r - 18;
    ctx.fillStyle = "#333";
    ctx.fillRect(x - w / 2, barY, w, h);
    const hpPercent = clamp(this.hp / this.maxHp, 0, 1);
    ctx.fillStyle =
      hpPercent > 0.5 ? "#6f6" : hpPercent > 0.25 ? "#fd6" : "#f66";
    ctx.fillRect(x - w / 2, barY, w * hpPercent, h);
  }
}

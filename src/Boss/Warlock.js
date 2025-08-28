import { ctx } from "../core.js";
import { clamp } from "../utils.js";
import { state, towers } from "../state.js";
import { BaseBoss } from "./BaseBoss.js";
import { BOSS_TYPES } from "./boss-types.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

export class warlock extends BaseBoss {
  constructor() {
    const bossType = BOSS_TYPES.Warlock;
    const difficultyMult = 1 + state.wave * 0.15;
    super(bossType, difficultyMult);

    this.hexTarget = null;
    this.hexRange = 300;
    this.hexDuration = 4;
    this.hexCooldown = 8000;
    this.lastHexTime = -this.hexCooldown;

    this.lastMoveSound = 0;

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
          soundManager.playSound("warlockStun", 0.3);
        }
      }
    }
    return bestTarget;
  }

  update(dt) {
    super.update(dt);
    if (this.dead) return;

    soundManager.playSound("warlockMove", 0.1);

    // Clean up invalid target
    if (this.hexTarget && !towers.includes(this.hexTarget)) {
      this.hexTarget = null;
    }

    const now = performance.now();

    // If existing target moved out of range or died, clear it immediately
    if (this.hexTarget) {
      const dCur = Math.hypot(
        this.pos.x - this.hexTarget.x,
        this.pos.y - this.hexTarget.y
      );
      if (this.hexTarget.dead || dCur > this.hexRange) {
        if (this.hexTarget.isHexed) {
          this.hexTarget.isHexed = false;
          this.hexTarget.hexTimer = 0;
        }
        this.hexTarget = null;
      }
    }

    if (now - this.lastHexTime > this.hexCooldown) {
      if (!this.hexTarget) {
        const target = this.findHexTarget();
        if (target) {
          // FIX: Use the applyHex method if it exists, otherwise fall back to direct property setting
          if (typeof target.applyHex === "function") {
            target.applyHex(this.hexDuration);
          } else {
            // Fallback for towers that don't have applyHex method
            target.isHexed = true;
            target.hexTimer = this.hexDuration;
            // Force a minimum cooldown to prevent immediate firing after hex expires
            target.cool = Math.max(target.cool, 0.25);
          }

          this.hexTarget = target;
          this.lastHexTime = now;
          this.hp = Math.min(this.maxHp, this.hp + this.siphonHealAmount);
        }
      }
    }

    // Clean up stale references
    if (this.hexTarget && this.hexTarget.isHexed === false) {
      this.hexTarget = null;
    }
  }

  draw() {
    if (this.dead) return;
    const { x, y } = this.pos;
    const TAU = Math.PI * 2;

    // Draw hex beam to target
    if (this.hexTarget && this.hexTarget.isHexed) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(this.hexTarget.x, this.hexTarget.y);
      ctx.strokeStyle = this.detailColor;
      ctx.lineWidth = 3 + Math.sin(performance.now() / 100);
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // The rest of the draw function remains the same
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

    // --- Numeric HP under the health bar (Warlock-style) ---
    const hpText = `${Math.round(Math.max(0, this.hp))}/${Math.round(
      this.maxHp
    )}`;
    const hpTextY = barY + h + 10; // slightly below the bar

    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // dark stroke for readability
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(hpText, x, hpTextY);

    // main fill
    ctx.fillStyle = "#fff";
    ctx.fillText(hpText, x, hpTextY);
  }
}

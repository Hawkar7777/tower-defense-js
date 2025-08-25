// src/enemy/Collector.js

import { BaseEnemy } from "./BaseEnemy.js";
import { ENEMY_TYPES } from "./enemyTypes.js";
import { state } from "../state.js";
import { ctx } from "../core.js";

export class Collector extends BaseEnemy {
  constructor(tier = 0) {
    super("collector", tier);

    const spec = ENEMY_TYPES.collector;
    this.moneyPerDamage = spec.moneyPerDamage;
    this.moneyHeld = 0;
  }

  /**
   * CORRECTED DAMAGE METHOD
   * This now correctly STEALS money from the player in real-time.
   * @param {number} d - The amount of damage to take.
   */
  damage(d) {
    // Prevent any logic from running if the enemy is already dead.
    if (this.dead) return;

    // --- REAL-TIME MONEY STEALING LOGIC ---
    const moneyToSteal = Math.floor(d * this.moneyPerDamage);

    if (moneyToSteal > 0) {
      // 1. Immediately REMOVE the money from the player's account.
      // Make sure the player can't go into negative money from this.
      const actualStolenAmount = Math.min(state.money, moneyToSteal);
      state.money -= actualStolenAmount;

      // 2. Add the stolen amount to the Collector's internal canister.
      this.moneyHeld += actualStolenAmount;
    }

    // 3. NOW, call the parent's damage method to handle HP loss and death.
    // The parent method will correctly call our special getReward() on death.
    super.damage(d);
  }

  /**
   * Overrides the default reward method.
   * When the parent class asks "how much money should I give?", this provides the answer.
   * @returns {number} The total reward including held money.
   */
  getReward() {
    // Return the small base reward PLUS all the money it successfully stole.
    return this.reward + this.moneyHeld;
  }

  // --- The draw methods are unchanged and correct ---
  draw() {
    if (this.dead) return;
    this.drawBody();
    this.drawStatusEffects();
    this.drawShield();
    this.drawHealthBar();
  }

  drawBody() {
    const { x, y } = this.pos;
    const size = this.r * 1.2;

    ctx.save();
    ctx.translate(x, y);

    const legAngle = Math.sin(this.animationOffset) * 0.4;
    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 5;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(size * 0.8 * i, 0);
      ctx.lineTo(size * 1.2 * i, -size * 0.8 + Math.sin(legAngle) * 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size * 0.8 * i, 0);
      ctx.lineTo(size * 1.2 * i, size * 0.8 + Math.sin(-legAngle) * 5);
      ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = Math.cos(angle) * size;
      const hy = Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    const canisterRadius = size * 0.6;
    const glowAlpha = Math.min(1.0, 0.2 + this.moneyHeld / 50);
    const grd = ctx.createRadialGradient(0, 0, 2, 0, 0, canisterRadius);
    grd.addColorStop(0, this.glowColor + "ff");
    grd.addColorStop(1, this.glowColor + "00");

    ctx.globalAlpha = glowAlpha;
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, canisterRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, canisterRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

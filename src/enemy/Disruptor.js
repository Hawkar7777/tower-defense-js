// src/enemy/Disruptor.js

import { BaseEnemy } from "./BaseEnemy.js";
import { ENEMY_TYPES } from "./enemyTypes.js";
import { state, towers } from "../state.js";
import { dist } from "../utils.js";
import { ctx } from "../core.js";

export class Disruptor extends BaseEnemy {
  constructor(tier = 0) {
    super("disruptor", tier);

    const spec = ENEMY_TYPES.disruptor;
    this.disruptionAuraRange = spec.disruptionAuraRange;
    this.missChance = spec.missChance;
    this.affectedTowers = new Set();
  }

  update(dt) {
    super.update(dt);
    if (this.dead) return;
    this.applyDisruptionAura();
  }

  applyDisruptionAura() {
    const newlyAffected = new Set();
    for (const tower of towers) {
      if (dist(this.pos, tower.center) <= this.disruptionAuraRange) {
        newlyAffected.add(tower);
      }
    }
    for (const tower of this.affectedTowers) {
      if (!newlyAffected.has(tower)) {
        tower.missChance = 0;
      }
    }
    for (const tower of newlyAffected) {
      tower.missChance = this.missChance;
    }
    this.affectedTowers = newlyAffected;
  }

  cleanup() {
    for (const tower of this.affectedTowers) {
      tower.missChance = 0;
    }
    this.affectedTowers.clear();
  }

  draw() {
    if (this.dead) return;
    // this.drawAura(); // <-- MODIFICATION: This call is removed.
    this.drawBody();
    this.drawStatusEffects();
    this.drawShield();
    this.drawHealthBar();
  }

  // --- MODIFICATION START ---
  /**
   * NEW METHOD: Draws a fully opaque aura to a specified canvas context (our buffer).
   * This allows us to merge all auras before applying transparency.
   * @param {CanvasRenderingContext2D} bufferCtx The context of the off-screen aura canvas.
   */
  drawAuraToBuffer(bufferCtx) {
    const { x, y } = this.pos;

    // Draw a solid circle. Transparency will be handled globally later.
    bufferCtx.fillStyle = this.glowColor;
    bufferCtx.beginPath();
    bufferCtx.arc(x, y, this.disruptionAuraRange, 0, Math.PI * 2);
    bufferCtx.fill();

    // We can also add the border here for a nice effect
    bufferCtx.strokeStyle = this.glowColor;
    bufferCtx.lineWidth = 2;
    bufferCtx.stroke();
  }

  // The old drawAura() method is completely removed.
  // --- MODIFICATION END ---

  // --- SIMPLIFIED: Less complex body drawing ---
  drawBody() {
    const { x, y } = this.pos;
    const size = this.r;

    ctx.save();
    ctx.translate(x, y);

    // --- Draw floating, rotating Pylons (Simplified) ---
    const numPylons = 3;
    for (let i = 0; i < numPylons; i++) {
      const angle = this.animationOffset + (i * (Math.PI * 2)) / numPylons;
      const orbitDist = size * 1.5;
      const pylonX = Math.cos(angle) * orbitDist;
      const pylonY = Math.sin(angle) * orbitDist;

      ctx.fillStyle = this.detailColor;
      ctx.fillRect(pylonX - 4, pylonY - 4, 8, 8);
    }

    // --- Draw Central Core ---
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Pulsing Center ---
    const pulse = Math.abs(Math.sin(this.animationOffset * 2)) * (size * 0.4);
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(0, 0, pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

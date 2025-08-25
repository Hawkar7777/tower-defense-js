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
    this.drawAura();
    this.drawBody();
    this.drawStatusEffects();
    this.drawShield();
    this.drawHealthBar();
  }

  // --- SIMPLIFIED: Less complex aura drawing ---
  drawAura() {
    const { x, y } = this.pos;

    // Instead of a gradient, we use a single, semi-transparent circle.
    // This is much faster to render.
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(x, y, this.disruptionAuraRange, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0; // Reset alpha immediately

    // We can add a simple, pulsing ring to show the edge without much performance cost.
    ctx.strokeStyle = this.glowColor + "88"; // Semi-transparent
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, this.disruptionAuraRange, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- SIMPLIFIED: Less complex body drawing ---
  drawBody() {
    const { x, y } = this.pos;
    const size = this.r;

    ctx.save();
    ctx.translate(x, y);

    // --- Draw floating, rotating Pylons (Simplified) ---
    // The pylons are still here, but they are simpler shapes.
    const numPylons = 3;
    for (let i = 0; i < numPylons; i++) {
      const angle = this.animationOffset + (i * (Math.PI * 2)) / numPylons;
      const orbitDist = size * 1.5;
      const pylonX = Math.cos(angle) * orbitDist;
      const pylonY = Math.sin(angle) * orbitDist;

      // Draw each pylon as a single, solid rectangle.
      // This avoids the save/restore/rotate operations which can be slow.
      ctx.fillStyle = this.detailColor;
      ctx.fillRect(pylonX - 4, pylonY - 4, 8, 8);
    }

    // --- Draw Central Core ---
    // The core is now a solid circle with a simple stroke.
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Pulsing Center ---
    // A simple, fast way to show the "active" state.
    const pulse = Math.abs(Math.sin(this.animationOffset * 2)) * (size * 0.4);
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(0, 0, pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

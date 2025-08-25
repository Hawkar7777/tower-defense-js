// src/enemy/Hive.js

import { BaseEnemy } from "./BaseEnemy.js";
import { ENEMY_TYPES } from "./enemyTypes.js";
import { state, enemies } from "../state.js";
import { ctx } from "../core.js";
// --- MODIFICATION 1: Import totalLen ---
import { totalLen } from "../path.js";

export class Hive extends BaseEnemy {
  constructor(tier = 0) {
    super("hive", tier);

    const spec = ENEMY_TYPES.hive;
    this.burstCount = spec.burstCount;
    this.swarmerType = spec.swarmerType;
  }

  damage(d) {
    const wasAlive = this.hp > 0;
    super.damage(d);
    if (wasAlive && this.dead) {
      this.burst();
    }
  }

  /**
   * Spawns a wave of Swarmers at the Hive's current position, now with proper spacing.
   */
  burst() {
    // Get the swarmer's spec to know its radius
    const swarmerSpec = ENEMY_TYPES[this.swarmerType];
    if (!swarmerSpec) {
      console.error(`Swarmer type "${this.swarmerType}" not found in config.`);
      return;
    }
    const swarmerRadius = swarmerSpec.radius;
    const desiredGap = 8; // A few pixels of space between each swarmer

    for (let i = 0; i < this.burstCount; i++) {
      const swarmer = new BaseEnemy(this.swarmerType, this.tier);

      // --- MODIFICATION 2: Calculate a unique position for each swarmer ---

      // Calculate an offset in pixels behind the Hive's death position.
      // The first swarmer (i=0) has no offset. The second is one diameter behind, etc.
      const pixelOffset = i * (swarmerRadius * 2 + desiredGap);

      // Convert this pixel offset into a path percentage ('t' value).
      const tOffset = pixelOffset / totalLen;

      // Set the swarmer's position. Use Math.max to prevent 't' from going below 0.
      swarmer.t = Math.max(0, this.t - tOffset);

      enemies.push(swarmer);
    }
  }

  // A custom draw method for the Hive's unique appearance
  draw() {
    if (this.dead) return;
    this.drawBody();
    this.drawStatusEffects();
    this.drawShield();
    this.drawHealthBar();
  }

  drawBody() {
    const { x, y } = this.pos;
    const size = this.r;
    const wobble = Math.sin(this.animationOffset / 3) * 3;

    ctx.save();
    ctx.translate(x, y);

    // --- Draw Legs ---
    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 4;
    for (let i = -1; i <= 1; i += 2) {
      // Side legs
      ctx.beginPath();
      ctx.moveTo(0, size * 0.6 * i);
      ctx.lineTo(size * 1.2, size * 0.8 * i + wobble * i);
      ctx.stroke();
      // Back legs
      ctx.beginPath();
      ctx.moveTo(-size * 0.7, size * 0.5 * i);
      ctx.lineTo(-size * 1.3, size * 0.6 * i - wobble * i);
      ctx.stroke();
    }

    // --- Draw Body ---
    ctx.fillStyle = this.detailColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.9, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Draw Pulsating Hive Sac ---
    const pulse = Math.abs(Math.sin(this.animationOffset / 2)) * 5;
    const grd = ctx.createRadialGradient(0, 0, 2, 0, 0, size * 0.6 + pulse);
    grd.addColorStop(0, this.glowColor + "ff");
    grd.addColorStop(1, this.glowColor + "00");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.6 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

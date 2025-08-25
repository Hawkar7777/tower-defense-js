// src/enemy/Hive.js

import { BaseEnemy } from "./BaseEnemy.js";
import { ENEMY_TYPES } from "./enemyTypes.js";
import { state, enemies } from "../state.js";
import { ctx } from "../core.js";

export class Hive extends BaseEnemy {
  constructor(tier = 0) {
    super("hive", tier);

    const spec = ENEMY_TYPES.hive;
    this.burstCount = spec.burstCount;
    this.swarmerType = spec.swarmerType;
  }

  // Override the damage method to add the on-death burst effect
  damage(d) {
    if (this.dead) return;

    // Apply damage directly to HP without calling the parent method yet
    this.hp -= d;

    // Check if this damage instance is the one that kills the Hive
    if (this.hp <= 0) {
      // Trigger the burst BEFORE handling the death of the Hive itself
      this.burst();

      // Now, call the parent's damage method with 0 damage. This will correctly
      // handle setting this.dead = true, giving money, and spawning death effects
      // without re-applying damage.
      super.damage(0);
    }
  }

  /**
   * Spawns a wave of Swarmers at the Hive's current position.
   */
  burst() {
    for (let i = 0; i < this.burstCount; i++) {
      // We create a new enemy instance directly.
      const swarmer = new BaseEnemy(this.swarmerType, this.tier);

      // --- CRITICAL ---
      // We set the swarmer's starting position ('t') to the Hive's current position.
      swarmer.t = this.t;

      // Add the new swarmer to the main game's enemy array.
      enemies.push(swarmer);
    }
    // You could spawn a bursting particle effect here as well.
  }

  // A custom draw method for the Hive's unique appearance
  draw() {
    if (this.dead) return;

    this.drawBody(); // Use our custom body

    // Use parent methods for common UI elements
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
    // Underbelly
    ctx.fillStyle = this.detailColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main Carapace (top shell)
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

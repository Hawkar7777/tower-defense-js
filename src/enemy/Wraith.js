// src/enemy/Wraith.js

import { BaseEnemy } from "./BaseEnemy.js";
import { ENEMY_TYPES } from "./enemyTypes.js";
import { enemies, state } from "../state.js";
import { dist } from "../utils.js";
import { ctx } from "../core.js";

let difficultyMult = () => 1 + state.wave * 0.15;

export class Wraith extends BaseEnemy {
  constructor(tier = 0) {
    super("wraith", tier); // This is important! It links to the config.

    const spec = ENEMY_TYPES.wraith;
    this.shieldRange = spec.shieldRange;
    this.shieldHp = spec.shieldHp * difficultyMult();
    this.shieldCooldownTime = spec.shieldCooldown;
    this.shieldCooldown = 0; // Starts ready to cast
    this.shieldTarget = null;
  }

  // Override the update method to add the shielding logic
  update(dt) {
    // Run the parent's update for movement and basic status effects
    super.update(dt);
    if (this.dead) return;

    this.shieldCooldown -= dt;

    // Check if the current target is dead, out of range, or is another Wraith
    if (this.shieldTarget) {
      if (
        this.shieldTarget.dead ||
        dist(this.pos, this.shieldTarget.pos) > this.shieldRange ||
        this.shieldTarget.type === "wraith"
      ) {
        this.shieldTarget = null;
      }
    }

    // If the cooldown is ready and there's no target, find a new one
    if (this.shieldCooldown <= 0 && !this.shieldTarget) {
      this.findTargetAndCastShield();
    }
  }

  findTargetAndCastShield() {
    let bestTarget = null;
    let maxHp = -1;

    // Find the non-Wraith enemy with the highest HP in range that doesn't have a shield
    for (const enemy of enemies) {
      if (
        !enemy.dead &&
        enemy !== this &&
        enemy.type !== "wraith" &&
        !enemy.shield &&
        dist(this.pos, enemy.pos) <= this.shieldRange
      ) {
        if (enemy.maxHp > maxHp) {
          maxHp = enemy.maxHp;
          bestTarget = enemy;
        }
      }
    }

    // If a valid target was found, apply the shield
    if (bestTarget) {
      this.shieldTarget = bestTarget;
      this.shieldTarget.shield = {
        hp: this.shieldHp,
        maxHp: this.shieldHp,
        source: this, // A reference back to the caster
      };
      this.shieldCooldown = this.shieldCooldownTime;
    }
  }

  // Override the draw method for a completely new visual style
  draw() {
    if (this.dead) return;
    const { x, y } = this.pos;
    const { r } = this;
    const TAU = Math.PI * 2;

    // --- Draw the connecting shield beam ---
    if (this.shieldTarget && !this.shieldTarget.dead) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(this.shieldTarget.pos.x, this.shieldTarget.pos.y);
      ctx.strokeStyle = "rgba(64, 255, 255, 0.5)";
      ctx.lineWidth = 2 + Math.sin(this.animationOffset) * 1;
      ctx.stroke();
    }

    // --- Draw the ghostly body ---
    // This replaces the spiky ball with swirling, semi-transparent layers
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const radius =
        r * (0.8 + Math.sin(this.animationOffset / 2 + i * 2) * 0.2);
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fillStyle = i === 0 ? this.glowColor : this.color;
      ctx.fill();
    }
    ctx.restore();

    // Call the parent draw method just for the health bar and status effects
    super.drawHealthBar();
    super.drawStatusEffects();
  }

  // Override the core drawing to be a single, glowing eye
  drawCore() {
    const { x, y } = this.pos;
    const coreSize = 4 + Math.sin(this.animationOffset / 3) * 1.5;

    // Eye glow
    const grd = ctx.createRadialGradient(x, y, 1, x, y, coreSize * 2);
    grd.addColorStop(0, this.detailColor);
    grd.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, coreSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(x, y, coreSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

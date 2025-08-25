// src/enemy/Mimic.js

import { BaseEnemy } from "./BaseEnemy.js";
import { ENEMY_TYPES } from "./enemyTypes.js";
import { state } from "../state.js";
import { ctx } from "../core.js";
import { roundRect } from "../helpers.js"; // Helper for drawing rectangles

let difficultyMult = () => 1 + state.wave * 0.15;

export class Mimic extends BaseEnemy {
  constructor(tier = 0) {
    super("mimic", tier);

    const spec = ENEMY_TYPES.mimic;
    this.isDisguised = true;
    this.damageTaken = 0;
    this.damageThreshold = spec.damageThreshold * difficultyMult();
    this.damageReduction = spec.damageReduction;

    // Start with the slow, disguised speed
    this.speed = spec.disguisedSpeed * difficultyMult();
  }

  damage(d) {
    if (this.dead) return;

    if (this.isDisguised) {
      const reducedDamage = d * (1 - this.damageReduction);
      super.damage(reducedDamage);
      this.damageTaken += reducedDamage;

      if (this.damageTaken >= this.damageThreshold) {
        this.transform();
      }
    } else {
      super.damage(d);
    }
  }

  transform() {
    this.isDisguised = false;
    const spec = ENEMY_TYPES.mimic;
    this.speed = spec.baseSpeed * difficultyMult();
  }

  draw() {
    if (this.dead) return;

    if (this.isDisguised) {
      this.drawDisguised();
    } else {
      this.drawRevealed();
    }

    this.drawStatusEffects();
    this.drawShield();
    this.drawHealthBar();
  }

  drawDisguised() {
    const { x, y } = this.pos;
    // --- CHANGE: Made the multiplier smaller (from 2.0 to 1.8) ---
    const size = this.r * 1.8;
    const wobble = Math.sin(this.animationOffset / 2) * 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(wobble * 0.05);

    // Main chest body
    roundRect(-size / 2, -size / 2, size, size, 4, this.color, true, "#572d20");

    // Gold trim
    ctx.fillStyle = this.detailColor;
    ctx.fillRect(-size / 2 - 2, -size / 2, 4, size);
    ctx.fillRect(size / 2 - 2, -size / 2, 4, size);
    ctx.fillRect(-size / 2, -size / 2 - 2, size, 4);
    ctx.fillRect(-size / 2, size / 2 - 2, size, 4);

    // Lock
    ctx.fillStyle = "#333";
    ctx.fillRect(-4, -6, 8, 8);
    ctx.fillStyle = this.detailColor;
    ctx.fillRect(-2, -4, 4, 4);

    ctx.restore();
  }

  drawRevealed() {
    const { x, y } = this.pos;
    // --- CHANGE: Made the multiplier smaller (from 2.2 to 2.0) ---
    const size = this.r * 2.0;
    const openAngle = Math.PI / 4 + Math.sin(this.animationOffset) * 0.1;

    ctx.save();
    ctx.translate(x, y);

    // Bottom half of the chest (the "body")
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "#572d20";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-size / 2, 0);
    ctx.lineTo(-size / 2, size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.lineTo(size / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top half (the "lid")
    ctx.save();
    ctx.rotate(-openAngle);
    roundRect(
      -size / 2,
      -size / 2,
      size,
      size / 2,
      3,
      this.color,
      true,
      "#572d20"
    );
    ctx.restore();

    // The monster inside
    // Glowing Eye
    const eyeSize = this.r * 0.8;
    const grd = ctx.createRadialGradient(0, 0, 2, 0, 0, eyeSize);
    grd.addColorStop(0, "#fff");
    grd.addColorStop(0.3, this.glowColor);
    grd.addColorStop(1, "rgba(255, 64, 255, 0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Crystalline Teeth
    ctx.fillStyle = "rgba(220, 200, 255, 0.8)";
    for (let i = 0; i < 5; i++) {
      const angle = -0.8 + i * 0.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * size * 0.7, Math.sin(angle) * size * 0.7);
      ctx.lineTo(
        Math.cos(angle + 0.1) * size * 0.6,
        Math.sin(angle + 0.1) * size * 0.6
      );
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

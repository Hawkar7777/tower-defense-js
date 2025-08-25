// src/enemy/Specter.js

import { BaseEnemy } from "./BaseEnemy.js";
import { ENEMY_TYPES } from "./enemyTypes.js";
import { state } from "../state.js";
import { ctx } from "../core.js";

export class Specter extends BaseEnemy {
  constructor(tier = 0) {
    super("specter", tier);

    const spec = ENEMY_TYPES.specter;
    this.corporealDuration = spec.corporealDuration;
    this.etherealDuration = spec.etherealDuration;

    // --- State Machine ---
    // 'corporeal': Solid and can be damaged.
    // 'ethereal': Phased and invulnerable.
    this.state = "corporeal";
    this.stateTimer = this.corporealDuration;
  }

  // Override the update method to handle state switching
  update(dt) {
    // We must call the parent update method to handle basic movement.
    super.update(dt);

    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      // Time to switch states!
      if (this.state === "corporeal") {
        this.state = "ethereal";
        this.stateTimer = this.etherealDuration;
      } else {
        this.state = "corporeal";
        this.stateTimer = this.corporealDuration;
      }
    }
  }

  // --- CRITICAL ABILITY ---
  // Override the damage method to make it invulnerable in the ethereal state.
  damage(d) {
    // If we are ethereal, simply ignore all incoming damage.
    if (this.state === "ethereal") {
      return; // Do nothing.
    }

    // If we are corporeal, take damage normally by calling the parent's method.
    super.damage(d);
  }

  // A custom draw method for its unique, non-circular, state-changing design
  draw() {
    if (this.dead) return;

    this.drawBody();

    // Use parent methods for common UI elements
    this.drawStatusEffects();
    this.drawShield();
    this.drawHealthBar();
  }

  drawBody() {
    const { x, y } = this.pos;
    const size = this.r * 1.8;

    // The visual appearance changes dramatically based on the state.
    // This is ESSENTIAL for players to understand the mechanic.
    const isEthereal = this.state === "ethereal";

    ctx.save();
    ctx.translate(x, y);

    // If ethereal, become semi-transparent and emit particles
    if (isEthereal) {
      ctx.globalAlpha = 0.3;
      // Draw ghostly particle trail
      for (let i = 0; i < 3; i++) {
        const pX = (Math.random() - 0.5) * size;
        const pY = (Math.random() - 0.5) * size;
        ctx.fillStyle = this.glowColor;
        ctx.beginPath();
        ctx.arc(pX, pY, Math.random() * 2 + 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- Draw the hooded, ghostly shape ---
    ctx.beginPath();
    ctx.moveTo(0, -size); // Top of the "hood"
    ctx.bezierCurveTo(
      size,
      -size, // Control point 1
      size * 0.8,
      0, // Control point 2
      size,
      size * 0.8 // End point (right "tendril")
    );
    ctx.quadraticCurveTo(
      0,
      size * 0.5, // Control point for the bottom curve
      -size,
      size * 0.8 // End point (left "tendril")
    );
    ctx.bezierCurveTo(
      -size * 0.8,
      0, // Control point 1
      -size,
      -size, // Control point 2
      0,
      -size // Back to the top
    );
    ctx.closePath();

    ctx.fillStyle = isEthereal ? this.glowColor : this.color;
    ctx.fill();

    // The core is only visible when the Specter is solid (corporeal)
    if (!isEthereal) {
      const coreSize = size * 0.3;
      const pulse = Math.sin(this.animationOffset) * 2;
      const grd = ctx.createRadialGradient(0, 0, 1, 0, 0, coreSize + pulse);
      grd.addColorStop(0, this.detailColor);
      grd.addColorStop(1, this.color + "00");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(0, 0, coreSize + pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

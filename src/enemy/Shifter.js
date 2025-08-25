// src/enemy/Shifter.js

import { BaseEnemy } from "./BaseEnemy.js";
import { ENEMY_TYPES } from "./enemyTypes.js";
import { state } from "../state.js";
import { ctx } from "../core.js";

let difficultyMult = () => 1 + state.wave * 0.15;

export class Shifter extends BaseEnemy {
  constructor(tier = 0) {
    super("shifter", tier);

    const spec = ENEMY_TYPES.shifter;
    this.shiftCooldownTime = spec.shiftCooldown;
    this.shiftChargeTime = spec.shiftChargeTime;
    this.shiftDistance = spec.shiftDistance;

    // --- State Machine ---
    // 'moving': Walking along the path
    // 'charging': Standing still, preparing to shift
    this.state = "moving";
    this.shiftCooldown = this.shiftCooldownTime / 2; // First shift happens faster
    this.chargeTimer = 0;

    this.originalSpeed = this.speed; // Store its speed for after charging
  }

  // Override the update method to implement the state machine
  update(dt) {
    // Handle the current state
    if (this.state === "moving") {
      // Move normally using the parent's logic
      super.update(dt);
      this.shiftCooldown -= dt;
      // When the cooldown is up, switch to the charging state
      if (this.shiftCooldown <= 0) {
        this.state = "charging";
        this.chargeTimer = this.shiftChargeTime;
        this.speed = 0; // Stop moving
      }
    } else if (this.state === "charging") {
      this.chargeTimer -= dt;
      // When charging is complete, execute the teleport
      if (this.chargeTimer <= 0) {
        this.teleport();
      }
    }
  }

  teleport() {
    // --- The Shift ---
    // Instantly jump forward along the path
    this.t += this.shiftDistance;
    if (this.t > 1) this.t = 1; // Don't overshoot the end

    // --- Reset State ---
    // You could spawn a teleport effect here
    this.state = "moving";
    this.speed = this.originalSpeed; // Resume normal speed
    this.shiftCooldown = this.shiftCooldownTime; // Reset the cooldown
  }

  // A completely custom draw method
  draw() {
    if (this.dead) return;

    this.drawBody();

    // Use parent methods for UI elements
    this.drawStatusEffects();
    this.drawShield();
    this.drawHealthBar();
  }

  drawBody() {
    const { x, y } = this.pos;
    const size = this.r * 1.5;

    ctx.save();
    ctx.translate(x, y);

    // --- Charging Visual Effect ---
    // This is crucial for gameplay so the player knows what's happening
    if (this.state === "charging") {
      const chargeRatio = 1 - this.chargeTimer / this.shiftChargeTime;
      const pulse = Math.abs(Math.sin(performance.now() / 50)) * (size * 0.8);

      // Draw a massive, unstable glow
      const grd = ctx.createRadialGradient(
        0,
        0,
        pulse * 0.5,
        0,
        0,
        size + pulse
      );
      grd.addColorStop(0, this.detailColor + "ff");
      grd.addColorStop(0.5, this.glowColor + "88");
      grd.addColorStop(1, this.glowColor + "00");
      ctx.fillStyle = grd;
      ctx.fillRect(-size * 2, -size * 2, size * 4, size * 4);

      // Vibrate the core body
      ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
    }

    // --- Main Body (a crystalline rhombus) ---
    ctx.beginPath();
    ctx.moveTo(0, -size); // Top point
    ctx.lineTo(size * 0.7, 0); // Right point
    ctx.lineTo(0, size); // Bottom point
    ctx.lineTo(-size * 0.7, 0); // Left point
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = this.glowColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Floating, orbiting crystal shards ---
    const numShards = 3;
    for (let i = 0; i < numShards; i++) {
      const angle = this.animationOffset + (i * (Math.PI * 2)) / numShards;
      const orbitDist = size * 1.2 + Math.sin(angle * 3) * 3;
      const shardX = Math.cos(angle) * orbitDist;
      const shardY = Math.sin(angle) * orbitDist;

      ctx.save();
      ctx.translate(shardX, shardY);
      ctx.rotate(angle);
      ctx.fillStyle = this.detailColor;
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(3, 5);
      ctx.lineTo(-3, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}

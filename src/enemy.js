// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\enemy.js =====

import { ctx } from "./core.js";
import { clamp, rand } from "./utils.js";
import { pointAt, totalLen } from "./path.js";
import { spawnDeath, spawnExplosion } from "./effects.js";
import { state } from "./state.js";

let difficultyMult = () => 1 + state.wave * 0.15;

export class Enemy {
  constructor(tier = 0) {
    this.t = 0;
    this.speed = 50 * difficultyMult();
    this.maxHp = (100 + tier * 40) * difficultyMult();
    this.hp = this.maxHp;
    this.reward = Math.round((8 + tier * 2) * difficultyMult());
    this.r = 12;
    this.dead = false;
    this.animationOffset = rand(Math.PI * 2); // Random starting point for animation
    this.tier = tier;
  }

  get pos() {
    return pointAt(this.t);
  }

  update(dt) {
    if (this.dead) return;
    this.t += (this.speed * dt) / totalLen;
    this.animationOffset += dt * 3; // Animate the enemy
    if (this.t >= 1) {
      this.dead = true;
      state.lives = Math.max(0, state.lives - 1);
      spawnExplosion(this.pos.x, this.pos.y, 20, "#f44");
    }
  }

  damage(d) {
    if (this.dead) return;
    this.hp -= d;
    if (this.hp <= 0) {
      this.dead = true;
      state.money += this.reward;
      spawnDeath(this.pos);
    }
  }

  draw() {
    if (this.dead) return;
    const { x, y } = this.pos;
    const TAU = Math.PI * 2;
    const { r } = this;

    // Different colors based on tier
    let mainColor, glowColor, detailColor;

    switch (this.tier % 4) {
      case 0: // Basic enemy
        mainColor = "#7df";
        glowColor = "#48f";
        detailColor = "#5ac";
        break;
      case 1: // Tier 1
        mainColor = "#f96";
        glowColor = "#f63";
        detailColor = "#d54";
        break;
      case 2: // Tier 2
        mainColor = "#9f6";
        glowColor = "#6f3";
        detailColor = "#5d4";
        break;
      case 3: // Tier 3
        mainColor = "#f6f";
        glowColor = "#c3f";
        detailColor = "#a3c";
        break;
    }

    // Glow effect
    const grd = ctx.createRadialGradient(x, y, 4, x, y, r + 10);
    grd.addColorStop(0, glowColor);
    grd.addColorStop(1, "rgba(0,255,255,0.0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r + 8, 0, TAU);
    ctx.fill();

    // Main body
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();

    // Enemy details - animated spikes/features
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const spikeCount = 6 + this.tier * 2;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i * TAU) / spikeCount + this.animationOffset;
      const spikeLength = 4 + Math.sin(this.animationOffset + i) * 2;
      const startX = x + Math.cos(angle) * (r - 2);
      const startY = y + Math.sin(angle) * (r - 2);
      const endX = x + Math.cos(angle) * (r + spikeLength);
      const endY = y + Math.sin(angle) * (r + spikeLength);

      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    }
    ctx.stroke();

    // Core/eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    const eyeSize = 4 - this.tier * 0.5;
    ctx.arc(x, y, Math.max(2, eyeSize), 0, TAU);
    ctx.fill();

    // Tier indicator - use visual markers instead of text
    if (this.tier > 0) {
      ctx.fillStyle = "#ff0"; // Yellow for tier indicators
      for (let i = 0; i < this.tier; i++) {
        ctx.beginPath();
        ctx.arc(x - 6 + i * 4, y - r - 6, 2, 0, TAU);
        ctx.fill();
      }
    }

    // Health bar
    const w = 28,
      h = 5;
    const p = clamp(this.hp / this.maxHp, 0, 1);
    ctx.fillStyle = "#132";
    ctx.fillRect(x - w / 2, y - r - 14, w, h);
    ctx.fillStyle = p > 0.5 ? "#6f6" : p > 0.25 ? "#fd6" : "#f66";
    ctx.fillRect(x - w / 2, y - r - 14, w * p, h);
  }
}

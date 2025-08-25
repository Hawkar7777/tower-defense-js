import { rand } from "../utils.js";
import { pointAt, totalLen } from "../path.js";
import { spawnDeath, spawnExplosion } from "../effects.js";
import { state } from "../state.js";
import { ctx } from "../core.js"; // <-- IMPORTANT: Import ctx here

// This class contains all the shared logic for every boss.
export class BaseBoss {
  constructor(bossType, difficultyMult) {
    this.type = bossType.name;
    this.speed = bossType.baseSpeed * difficultyMult;
    this.maxHp = bossType.baseHp * difficultyMult;
    this.hp = this.maxHp;
    this.reward = Math.round(bossType.baseReward * difficultyMult);
    this.r = bossType.radius;
    this.color = bossType.color;
    this.glowColor = bossType.glowColor;
    this.detailColor = bossType.detailColor;
    this.shieldColor = bossType.shieldColor;
    this.livesPenalty = bossType.livesPenalty || 20;

    this.t = 0;
    this.dead = false;
    this.originalSpeed = this.speed;
    this.animationOffset = rand(Math.PI * 2);

    this.slowEffect = null;
    this.frozen = false;
    this.stunned = false;
  }

  get pos() {
    return pointAt(this.t);
  }

  damage(d) {
    if (this.dead) return;
    this.hp -= d;
    if (this.hp <= 0) {
      this.dead = true;
      state.money += this.reward;
      spawnDeath(this.pos, this.r);
      // --- FIX: Immediately call cleanup when the boss dies ---
      // This ensures effects like auras are removed instantly.
      this.cleanup();
    }
  }

  update(dt) {
    if (this.dead) return;
    this.t += (this.speed * dt) / totalLen;
    this.animationOffset += dt * 0.5;
    if (this.t >= 1) {
      this.dead = true;
      state.lives = Math.max(0, state.lives - this.livesPenalty);
      spawnExplosion(this.pos.x, this.pos.y, this.r * 2, "#f44");
      // --- FIX: Also call cleanup when the boss reaches the end ---
      this.cleanup();
    }
  }

  // --- FIX: Add a base cleanup method ---
  // This method is intended to be overridden by bosses with special effects
  // (like the Basilisk) to remove those effects upon death.
  cleanup() {
    // Base implementation is empty.
  }

  draw() {
    if (this.dead) return;
    const { x, y } = this.pos;

    // --- Health Bar Logic ---
    const barWidth = this.r * 2;
    const barHeight = 8;
    const barX = x - this.r;
    const barY = y - this.r - 20; // Position above the boss

    // Bar background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health foreground
    const hpPercent = Math.max(0, this.hp / this.maxHp);
    const hpColor =
      hpPercent > 0.6 ? "#4CAF50" : hpPercent > 0.3 ? "#FFC107" : "#F44336";
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }
}

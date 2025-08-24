// src/enemy/BaseEnemy.js

import { ctx } from "../core.js";
import { clamp, rand } from "../utils.js";
import { pointAt, totalLen } from "../path.js";
import { spawnDeath, spawnExplosion } from "../effects.js";
import { state } from "../state.js";
import { ENEMY_TYPES } from "../enemy/enemyTypes.js";

let difficultyMult = () => 1 + state.wave * 0.15;

export class BaseEnemy {
  constructor(type, tier = 0) {
    const enemyType = ENEMY_TYPES[type] || ENEMY_TYPES.basic;
    this.type = type;

    // Assign all properties from config
    this.t = 0;
    this.speed = enemyType.baseSpeed * difficultyMult();
    this.maxHp = (enemyType.baseHp + tier * 40) * difficultyMult();
    this.hp = this.maxHp;
    this.reward = Math.round(
      (enemyType.baseReward + tier * 2) * difficultyMult()
    );
    this.r = enemyType.radius;
    this.color = enemyType.color;
    this.glowColor = enemyType.glowColor;
    this.detailColor = enemyType.detailColor;
    this.dead = false;
    this.animationOffset = rand(Math.PI * 2);
    this.tier = tier;

    // Status effects
    this.slowEffect = null;
    this.frozen = false;
    this.iceEffect = false;
    this.iceEffectTime = 0;
    this.stunned = false;
    this.originalSpeed = this.speed;
    this.electricEffect = false;
    this.electricEffectTime = 0;
    this.poisoned = false;
    this.poisonDamage = 0;
    this.poisonDuration = 0;
    this.poisonStartTime = 0;
    this.burning = false;
    this.burnDamage = 0;
    this.burnDuration = 0;
    this.burnStartTime = 0;
  }

  get pos() {
    return pointAt(this.t);
  }

  // Standard movement and status effect logic
  update(dt) {
    if (this.dead) return;

    this.t += (this.speed * dt) / totalLen;
    this.animationOffset += dt * 3;

    if (this.t >= 1) {
      this.dead = true;
      state.lives = Math.max(0, state.lives - 1);
      spawnExplosion(this.pos.x, this.pos.y, 20, "#f44");
    }

    // Status effect timers
    if (this.slowEffect) {
      this.slowEffect.duration -= dt;
      if (this.slowEffect.duration <= 0) {
        this.speed = this.slowEffect.originalSpeed;
        this.slowEffect = null;
      }
    }
    if (this.iceEffect) {
      this.iceEffectTime -= dt;
      if (this.iceEffectTime <= 0) this.iceEffect = false;
    }
    if (this.stunned) this.speed = 0;
    if (this.electricEffect) {
      this.electricEffectTime -= dt;
      if (this.electricEffectTime <= 0) this.electricEffect = false;
    }
    if (this.poisoned) {
      if (
        (performance.now() - this.poisonStartTime) / 1000 >=
        this.poisonDuration
      ) {
        this.poisoned = false;
      }
    }
    if (this.burning) {
      if (
        (performance.now() - this.burnStartTime) / 1000 >=
        this.burnDuration
      ) {
        this.burning = false;
      }
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

    // All your detailed drawing logic for status effects
    if (this.burning) {
      /* ... */
    }
    if (this.poisoned) {
      /* ... */
    }
    if (this.electricEffect || this.stunned) {
      /* ... */
    }
    if (this.iceEffect || this.frozen) {
      /* ... */
    }

    // Glow effect, main body, spikes
    const grd = ctx.createRadialGradient(x, y, 4, x, y, r + 10);
    grd.addColorStop(0, this.glowColor);
    grd.addColorStop(1, "rgba(0,255,255,0.0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r + 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = this.detailColor;
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

    // Core/eye (can be overridden by child classes)
    this.drawCore();

    // Tier indicator and Health bar
    if (this.tier > 0) {
      /* ... */
    }
    const w = 28,
      h = 5;
    const p = clamp(this.hp / this.maxHp, 0, 1);
    ctx.fillStyle = "#132";
    ctx.fillRect(x - w / 2, y - r - 14, w, h);
    ctx.fillStyle = p > 0.5 ? "#6f6" : p > 0.25 ? "#fd6" : "#f66";
    ctx.fillRect(x - w / 2, y - r - 14, w * p, h);
  }

  drawCore() {
    const { x, y } = this.pos;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    const eyeSize = 4 - this.tier * 0.5;
    ctx.arc(x, y, Math.max(2, eyeSize), 0, Math.PI * 2);
    ctx.fill();
  }
}

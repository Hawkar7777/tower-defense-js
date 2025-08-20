// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\enemy.js =====

import { ctx } from "./core.js";
import { clamp, rand } from "./utils.js";
import { pointAt, totalLen } from "./path.js";
import { spawnDeath, spawnExplosion } from "./effects.js";
import { state } from "./state.js";

// Enemy type definitions - encapsulated with all their properties
export const ENEMY_TYPES = {
  basic: {
    name: "Scout",
    baseHp: 100,
    baseSpeed: 50,
    baseReward: 8,
    radius: 12,
    color: "#7df",
    glowColor: "#48f",
    detailColor: "#5ac",
    tierIndicator: 0,
    spawnWeight: 1.0,
    description: "Basic enemy unit",
  },
  brute: {
    name: "Brute",
    baseHp: 180,
    baseSpeed: 40,
    baseReward: 15,
    radius: 16,
    color: "#f96",
    glowColor: "#f63",
    detailColor: "#d54",
    tierIndicator: 1,
    spawnWeight: 0.7,
    description: "Slow but tough enemy",
  },
  swift: {
    name: "Swift",
    baseHp: 80,
    baseSpeed: 70,
    baseReward: 12,
    radius: 10,
    color: "#9f6",
    glowColor: "#6f3",
    detailColor: "#5d4",
    tierIndicator: 2,
    spawnWeight: 0.8,
    description: "Fast but fragile enemy",
  },
  elite: {
    name: "Elite",
    baseHp: 250,
    baseSpeed: 45,
    baseReward: 25,
    radius: 14,
    color: "#f6f",
    glowColor: "#c3f",
    detailColor: "#a3c",
    tierIndicator: 3,
    spawnWeight: 0.4,
    description: "Powerful elite enemy",
  },
};

// Difficulty scaling function
let difficultyMult = () => 1 + state.wave * 0.15;

export class Enemy {
  constructor(type = "basic", tier = 0) {
    const enemyType = ENEMY_TYPES[type] || ENEMY_TYPES.basic;

    this.type = type;
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
    this.tierIndicator = enemyType.tierIndicator;
    this.dead = false;
    this.animationOffset = rand(Math.PI * 2);
    this.tier = tier;

    this.slowEffect = null;
    this.frozen = false;
    this.iceEffect = false;
    this.iceEffectTime = 0;

    // Add these properties to the Enemy class constructor:
    this.stunned = false;
    this.originalSpeed = this.speed;
    this.electricEffect = false;
    this.electricEffectTime = 0;
  }

  get pos() {
    return pointAt(this.t);
  }

  update(dt) {
    if (this.dead) return;
    this.t += (this.speed * dt) / totalLen;
    this.animationOffset += dt * 3;

    if (this.t >= 1) {
      this.dead = true;
      state.lives = Math.max(0, state.lives - 1);
      spawnExplosion(this.pos.x, this.pos.y, 20, "#f44");
    }

    if (this.slowEffect) {
      this.slowEffect.duration -= dt;
      if (this.slowEffect.duration <= 0) {
        this.speed = this.slowEffect.originalSpeed;
        this.slowEffect = null;
      }
    }

    if (this.iceEffect) {
      this.iceEffectTime -= dt;
      if (this.iceEffectTime <= 0) {
        this.iceEffect = false;
      }
    }

    if (this.stunned) {
      this.speed = 0;
    }

    if (this.electricEffect) {
      this.electricEffectTime -= dt;
      if (this.electricEffectTime <= 0) {
        this.electricEffect = false;
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

    if (this.electricEffect || this.stunned) {
      const alpha = this.stunned ? 0.7 : 0.4;
      ctx.fillStyle = `rgba(157, 78, 221, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, this.r + 3, 0, TAU);
      ctx.fill();

      // Draw electric arcs on stunned enemies
      if (this.stunned) {
        ctx.strokeStyle = "rgba(224, 170, 255, 0.8)";
        ctx.lineWidth = 1.5;

        for (let i = 0; i < 3; i++) {
          const angle1 = Math.random() * TAU;
          const angle2 = angle1 + (Math.random() - 0.5) * Math.PI;
          const dist1 = this.r * (0.5 + Math.random() * 0.5);
          const dist2 = this.r * (0.8 + Math.random() * 0.2);

          ctx.beginPath();
          ctx.moveTo(
            x + Math.cos(angle1) * dist1,
            y + Math.sin(angle1) * dist1
          );

          // Create jagged lightning effect
          const segments = 3;
          const dx =
            (Math.cos(angle2) * dist2 - Math.cos(angle1) * dist1) / segments;
          const dy =
            (Math.sin(angle2) * dist2 - Math.sin(angle1) * dist1) / segments;

          for (let j = 1; j <= segments; j++) {
            const segX = x + Math.cos(angle1) * dist1 + dx * j;
            const segY = y + Math.sin(angle1) * dist1 + dy * j;
            const offsetX = (Math.random() - 0.5) * 5;
            const offsetY = (Math.random() - 0.5) * 5;
            ctx.lineTo(segX + offsetX, segY + offsetY);
          }

          ctx.stroke();
        }
      }
    }

    // Glow effect
    const grd = ctx.createRadialGradient(x, y, 4, x, y, r + 10);
    grd.addColorStop(0, this.glowColor);
    grd.addColorStop(1, "rgba(0,255,255,0.0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r + 8, 0, TAU);
    ctx.fill();

    // Main body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();

    // Enemy details - animated spikes/features
    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    if (this.iceEffect || this.frozen) {
      const alpha = this.frozen ? 0.6 : 0.3;
      ctx.fillStyle = `rgba(180, 230, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, this.r + 2, 0, TAU);
      ctx.fill();

      if (this.frozen) {
        // Draw ice cracks
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - this.r * 0.7, y - this.r * 0.3);
        ctx.lineTo(x + this.r * 0.5, y + this.r * 0.4);
        ctx.moveTo(x + this.r * 0.2, y - this.r * 0.6);
        ctx.lineTo(x - this.r * 0.3, y + this.r * 0.7);
        ctx.stroke();
      }
    }

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

    // Tier indicator
    if (this.tier > 0) {
      ctx.fillStyle = "#ff0";
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

// Helper function to get enemy types by wave
export function getEnemiesForWave(wave) {
  const enemies = [];
  const totalCount = 8 + wave * 2;

  // Determine which enemy types can spawn this wave
  const availableTypes = [];

  if (wave >= 1) availableTypes.push("basic");
  if (wave >= 2) availableTypes.push("brute");
  if (wave >= 3) availableTypes.push("swift");
  if (wave >= 5) availableTypes.push("elite");

  // Calculate tier based on wave
  const tier = Math.floor((wave - 1) / 1.5);

  // Distribute enemies based on type weights
  for (let i = 0; i < totalCount; i++) {
    let type;

    // For early waves, use only basic enemies
    if (wave < 2) {
      type = "basic";
    } else {
      // Weighted random selection for later waves
      const weights = availableTypes.map((t) => ENEMY_TYPES[t].spawnWeight);
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      let random = Math.random() * totalWeight;

      for (let j = 0; j < availableTypes.length; j++) {
        random -= weights[j];
        if (random <= 0) {
          type = availableTypes[j];
          break;
        }
      }
    }

    enemies.push({ type, tier });
  }

  return enemies;
}

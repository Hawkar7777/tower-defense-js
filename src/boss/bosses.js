import { ctx } from "../core.js";
import { clamp, rand } from "../utils.js";
import { pointAt, totalLen } from "../path.js";
import { spawnDeath, spawnExplosion } from "../effects.js";
import { state, enemies } from "../state.js";
import { Enemy } from "../enemy.js";

// =============================================================================
// --- CENTRAL BOSS DEFINITIONS ---
// All boss stats and properties are defined here for easy management.
// =============================================================================
const BOSS_TYPES = {
  Goliath: {
    name: "Goliath",
    baseHp: 5000,
    baseShieldHp: 2500,
    baseSpeed: 25,
    baseReward: 500,
    radius: 30,
    color: "#2a0a4a",
    glowColor: "#ff4040",
    detailColor: "#8e44ad",
    shieldColor: "rgba(52, 152, 219, 0.7)",
    livesPenalty: 15,
  },
  Phantom: {
    name: "Phantom",
    baseHp: 6000,
    baseSpeed: 60,
    baseReward: 450,
    radius: 18,
    color: "#d7dfe2",
    glowColor: "#00ffff",
    detailColor: "#7f8c8d",
    livesPenalty: 30,
  },
  // You can easily add a new boss here in the future!
};

// =============================================================================
// --- BASE BOSS CLASS ---
// Contains all the shared logic for every boss.
// =============================================================================
class BaseBoss {
  constructor(bossType, difficultyMult) {
    // Copy all properties from the boss type definition
    this.type = bossType.name;
    this.speed = bossType.baseSpeed * difficultyMult;
    this.maxHp = bossType.baseHp * difficultyMult;
    this.hp = this.maxHp;
    this.reward = Math.round(bossType.baseReward * difficultyMult);
    this.r = bossType.radius;
    this.color = bossType.color;
    this.glowColor = bossType.glowColor;
    this.detailColor = bossType.detailColor;
    this.shieldColor = bossType.shieldColor; // Store for later use
    this.livesPenalty = bossType.livesPenalty || 20; // Default penalty

    // Universal properties
    this.t = 0;
    this.dead = false;
    this.originalSpeed = this.speed;
    this.animationOffset = rand(Math.PI * 2);

    // Default status effects
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
    }
  }
}

// =============================================================================
// --- GOLIATH CLASS (Behavior-specific) ---
// =============================================================================
export class Goliath extends BaseBoss {
  constructor() {
    const bossType = BOSS_TYPES.Goliath;
    const difficultyMult = 1 + state.wave * 0.1;
    super(bossType, difficultyMult);

    // Goliath-specific properties (Shield and Minion Spawning)
    this.maxShieldHp = bossType.baseShieldHp * difficultyMult;
    this.shieldHp = this.maxShieldHp;
    this.shieldActive = true;
    this.lastMinionSpawnTime = performance.now();
    this.minionSpawnCooldown = 8000;
  }

  // Override update to add minion spawning logic
  update(dt) {
    if (this.shieldActive) {
      this.speed = this.originalSpeed;
      this.frozen = false;
      this.stunned = false;
    }
    super.update(dt); // Run the base movement and path-end logic

    const now = performance.now();
    if (now - this.lastMinionSpawnTime > this.minionSpawnCooldown) {
      this.lastMinionSpawnTime = now;
      const minion = new Enemy("basic");
      minion.t = this.t;
      enemies.push(minion);
    }
  }

  // Override damage to handle the shield
  damage(d) {
    if (this.dead) return;
    if (this.shieldActive) {
      this.shieldHp -= d;
      if (this.shieldHp <= 0) {
        this.shieldActive = false;
        spawnExplosion(this.pos.x, this.pos.y, this.r + 10, this.shieldColor);
      }
    } else {
      super.damage(d); // Fall back to base damage logic for HP
    }
  }

  // The draw method is unique to each boss's appearance
  draw() {
    if (this.dead) return;
    const { x, y } = this.pos;
    const TAU = Math.PI * 2;

    // Armored plates
    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 5;
    for (let i = 0; i < 6; i++) {
      const angle = (i * TAU) / 6 + this.animationOffset;
      ctx.beginPath();
      ctx.moveTo(
        x + Math.cos(angle) * (this.r - 4),
        y + Math.sin(angle) * (this.r - 4)
      );
      ctx.lineTo(
        x + Math.cos(angle) * (this.r + 10),
        y + Math.sin(angle) * (this.r + 10)
      );
      ctx.stroke();
    }
    // Main body & core
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(x, y, this.r * 0.3, 0, TAU);
    ctx.fill();

    // Shield visual
    if (this.shieldActive) {
      ctx.fillStyle = this.shieldColor;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      const pulse = 1 + Math.sin(performance.now() / 200) * 0.05;
      ctx.beginPath();
      ctx.arc(x, y, (this.r + 6) * pulse, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    // Health Bars
    const w = 60,
      h = 7;
    const barY = y - this.r - 24;
    ctx.fillStyle = "#333";
    ctx.fillRect(x - w / 2, barY, w, h);
    const hpPercent = clamp(this.hp / this.maxHp, 0, 1);
    ctx.fillStyle =
      hpPercent > 0.5 ? "#6f6" : hpPercent > 0.25 ? "#fd6" : "#f66";
    ctx.fillRect(x - w / 2, barY, w * hpPercent, h);
    if (this.shieldActive) {
      const shieldY = barY - (h + 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(x - w / 2, shieldY, w, h - 2);
      const shieldPercent = clamp(this.shieldHp / this.maxShieldHp, 0, 1);
      ctx.fillStyle = "#0af";
      ctx.fillRect(x - w / 2, shieldY, w * shieldPercent, h - 2);
    }
  }
}

// =============================================================================
// --- PHANTOM CLASS (Behavior-specific) ---
// =============================================================================
export class Phantom extends BaseBoss {
  constructor() {
    const bossType = BOSS_TYPES.Phantom;
    const difficultyMult = 1 + state.wave * 0.12;
    super(bossType, difficultyMult);

    // Phantom-specific properties (Phasing)
    this.phasing = false;
    this.phaseDuration = 0.5;
    this.phaseCooldown = 6;
    this.lastPhaseTime = performance.now();
    this.phaseDistance = 0.08;
  }

  // Override update to add phasing logic
  update(dt) {
    const now = performance.now();
    if (
      !this.phasing &&
      (now - this.lastPhaseTime) / 1000 > this.phaseCooldown
    ) {
      this.phasing = true;
      this.phaseStartTime = now;
      this.lastPhaseTime = now;
      this.t += this.phaseDistance; // Instantly jump forward
    }
    if (
      this.phasing &&
      (now - this.phaseStartTime) / 1000 > this.phaseDuration
    ) {
      this.phasing = false;
    }
    super.update(dt); // Run base movement logic
  }

  // Override damage to make it untargetable while phasing
  damage(d) {
    if (this.phasing || this.dead) return;
    super.damage(d);
  }

  // The draw method is unique to each boss's appearance
  draw() {
    if (this.dead) return;
    const { x, y } = this.pos;
    const TAU = Math.PI * 2;

    ctx.globalAlpha = this.phasing ? 0.3 : 1.0; // Visual effect for phasing

    // Body and details
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const angle = (i * TAU) / 3 + this.animationOffset * 1.5;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * this.r, y + Math.sin(angle) * this.r);
      ctx.lineTo(
        x + Math.cos(angle + 0.3) * (this.r + 10),
        y + Math.sin(angle + 0.3) * (this.r + 10)
      );
      ctx.stroke();
    }

    // Glow effect
    const grd = ctx.createRadialGradient(x, y, 2, x, y, this.r + 5);
    grd.addColorStop(0, this.glowColor);
    grd.addColorStop(1, "rgba(0,255,255,0.0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, this.r + 8, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = 1.0; // Reset alpha

    // Health Bar
    const w = 50,
      h = 6;
    const barY = y - this.r - 18;
    ctx.fillStyle = "#333";
    ctx.fillRect(x - w / 2, barY, w, h);
    const hpPercent = clamp(this.hp / this.maxHp, 0, 1);
    ctx.fillStyle = "#6f6";
    ctx.fillRect(x - w / 2, barY, w * hpPercent, h);
  }
}

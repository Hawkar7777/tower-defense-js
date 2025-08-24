import { rand } from "../utils.js";
import { pointAt, totalLen } from "../path.js";
import { spawnDeath, spawnExplosion } from "../effects.js";
import { state } from "../state.js";

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
